import React, { useState, useRef, useEffect } from 'react';
import { SentenceItem, SentenceEvaluation } from '../types';
import { blobToFloat32Array, transcribeAudio, isDegenerateTranscript } from '../lib/whisper';
import { evaluateDualSentence } from '../lib/speechAnalysis';
import { pcmToWavBlob } from '../lib/wavEncoder';
import { ensureDevanagari } from '../lib/devanagari';
import { savePromptRecord } from '../lib/dbService';
import confetti from 'canvas-confetti';
import {
  Mic,
  Square,
  RotateCcw,
  Volume2,
  FileText,
  Download,
  Sparkles,
  CheckCircle,
  Activity
} from 'lucide-react';

interface Props {
  sentences: SentenceItem[];
  onGenerateReport: (evaluations: SentenceEvaluation[]) => void;
  whisperReady: boolean;
  childName: string;
  speakerId: string;
}

const CARTOON_CHEERS = [
  { emoji: "🌟", title: "Hurrah! Super Job!", phrase: "You tried so well! You speak like a little champ!" },
  { emoji: "🎉", title: "Woohoo! Great Effort!", phrase: "Awesome speaking! That was wonderful and clear!" },
  { emoji: "🐰", title: "Fantastic Speaking!", phrase: "High five! You pronounced it with great courage!" },
  { emoji: "🚀", title: "Rocket Fast!", phrase: "Keep going, little star! You are doing amazing!" },
  { emoji: "🦁", title: "Brave Voice!", phrase: "Lion-heart effort! Your voice is getting clearer every time!" }
];

export const SentenceRecorder: React.FC<Props> = ({
  sentences,
  onGenerateReport,
  whisperReady,
  childName,
  speakerId
}) => {
  const [selectedSentenceId, setSelectedSentenceId] = useState<number>(1);
  const [evaluationsMap, setEvaluationsMap] = useState<Record<number, SentenceEvaluation>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recentEval, setRecentEval] = useState<SentenceEvaluation | null>(null);
  const [cheerMsg, setCheerMsg] = useState(CARTOON_CHEERS[0]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordStartTimeRef = useRef<number>(0);

  // Browser Web Speech API ASR references (exact ReVoice dual-engine pipeline)
  const recognitionRef = useRef<any>(null);
  const browserTranscriptRef = useRef<string>('');

  const currentSentence = sentences.find(s => s.id === selectedSentenceId) || sentences[0];
  const completedCount = Object.keys(evaluationsMap).length;

  const getAudioFileName = (sid: number) => {
    const sIdFormatted = sid.toString().padStart(2, '0');
    return `REC_${speakerId.toUpperCase()}_L0S${sIdFormatted}.WAV`;
  };

  const triggerAutoAudioDownload = (wavBlob: Blob, sentenceId: number) => {
    try {
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.href = url;
      const fileName = getAudioFileName(sentenceId);
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn('Auto download audio error:', e);
    }
  };

  // Helper to init browser SpeechRecognition for Hindi
  const startBrowserASR = () => {
    browserTranscriptRef.current = '';
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('[Browser ASR] Web Speech API not supported in this browser.');
      return;
    }

    try {
      const recognizer = new SpeechRecognition();
      recognizer.lang = 'hi-IN';
      recognizer.continuous = true;
      recognizer.interimResults = true;
      recognizer.maxAlternatives = 1;

      recognizer.onresult = (event: any) => {
        let finalStr = '';
        for (let i = 0; i < event.results.length; i++) {
          finalStr += event.results[i][0].transcript + ' ';
        }
        browserTranscriptRef.current = finalStr.trim();
      };

      recognizer.onerror = (e: any) => {
        console.warn('[Browser ASR] error:', e?.error || e);
      };

      recognizer.onend = () => {
        // Recognizer ended
      };

      recognizer.start();
      recognitionRef.current = recognizer;
    } catch (err) {
      console.warn('[Browser ASR] failed to start:', err);
    }
  };

  const stopBrowserASR = (): string => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      recognitionRef.current = null;
    }
    return browserTranscriptRef.current.trim();
  };

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      // Start Browser Web Speech API in parallel with MediaRecorder (Exact ReVoice pattern)
      startBrowserASR();

      recordStartTimeRef.current = performance.now();
      recorder.start();
      setIsRecording(true);
      setRecentEval(null);
    } catch (err: any) {
      alert('Microphone access denied: ' + (err.message || err));
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current || !isRecording) return;
    setIsRecording(false);
    setIsProcessing(true);

    // Stop browser ASR
    const capturedBrowserASR = stopBrowserASR();

    const recorder = mediaRecorderRef.current;
    recorder.onstop = async () => {
      try {
        const durationMs = Math.max(500, performance.now() - recordStartTimeRef.current);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        // 1. Decode audio into 16kHz PCM Float32 for Whisper with exact trimSilence from ReVoice
        const pcmData = await blobToFloat32Array(audioBlob);

        // 2. Convert PCM Float32 into lossless, high-quality 16-bit WAV file and auto-download!
        const wavBlob = pcmToWavBlob(pcmData, 16000);
        triggerAutoAudioDownload(wavBlob, currentSentence.id);

        // 3. Client-side Whisper STT (language: 'hindi')
        const rawWhisper = await transcribeAudio(pcmData, 'hindi');
        const promptWordCount = currentSentence.hindi.trim().split(/\s+/).filter(Boolean).length;

        let whisperDevanagari = '';
        if (rawWhisper && isDegenerateTranscript(rawWhisper, promptWordCount)) {
          console.warn('[Whisper] Degenerate decode loop discarded:', rawWhisper);
          whisperDevanagari = '';
        } else {
          // Normalize any Perso-Arabic or Roman characters into Devanagari Hindi
          whisperDevanagari = ensureDevanagari(rawWhisper);
        }

        // Clean browser ASR output (ensure strict Hindi Devanagari)
        const browserDevanagari = ensureDevanagari(capturedBrowserASR || browserTranscriptRef.current);

        // 4. Clinical Dual Speech Clarity Evaluation (Exact ReVoice dual-engine logic)
        // Combines Browser ASR Devanagari with Whisper Phonetic STT
        const evalResult = evaluateDualSentence(
          currentSentence,
          whisperDevanagari,
          browserDevanagari,
          durationMs
        );
        evalResult.speakerId = speakerId.toUpperCase();
        evalResult.audioFilename = getAudioFileName(currentSentence.id);
        setRecentEval(evalResult);

        // Save into evaluation dictionary
        setEvaluationsMap(prev => ({
          ...prev,
          [currentSentence.id]: evalResult
        }));

        // Real-time auto sync to Supabase sentence_records table
        savePromptRecord(speakerId, evalResult, currentSentence.roman).catch(err => {
          console.warn('[DB] prompt save error caught:', err);
        });

        // Pick random encouraging cartoon cheer
        const cheer = CARTOON_CHEERS[Math.floor(Math.random() * CARTOON_CHEERS.length)];
        setCheerMsg(cheer);

        // Pop celebratory confetti!
        try {
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.6 }
          });
        } catch (_) {}

      } catch (err: any) {
        console.error('Error during whisper/ASR processing:', err);
        const fallback = evaluateDualSentence(
          currentSentence,
          '',
          browserTranscriptRef.current,
          1000
        );
        fallback.feedback = 'Microphone error: ' + (err.message || 'Audio not processed');
        setRecentEval(fallback);
      } finally {
        setIsProcessing(false);
        recorder.stream.getTracks().forEach(t => t.stop());
      }
    };

    recorder.stop();
  };

  const playTTSPrompt = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'hi-IN';
      utter.rate = 0.82;
      window.speechSynthesis.speak(utter);
    }
  };

  const handleGenerateReportClick = () => {
    const list = Object.values(evaluationsMap);
    if (list.length === 0) {
      alert('Please record at least 1 sentence before generating diagnosis report!');
      return;
    }
    onGenerateReport(list);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner: Quick Stats & Generate Report Button when >= 1 sentence completed */}
      <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 p-5 rounded-3xl shadow-lg text-white flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl shadow-inner">
            🐰
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black tracking-tight">Speech Practice Station</h2>
              <span className="font-mono text-xs bg-white text-orange-700 font-black px-2 py-0.5 rounded-md shadow-xs">
                {speakerId.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-white/90 font-medium mt-0.5">
              Child: <span className="font-bold underline">{childName}</span> • Recorded: <strong>{completedCount} of {sentences.length}</strong>
            </p>
          </div>
        </div>

        {/* Generate Report Button visible whenever at least 1 sentence has been spoken */}
        {completedCount >= 1 ? (
          <button
            onClick={handleGenerateReportClick}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white text-orange-600 font-extrabold shadow-md hover:bg-orange-50 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm border-2 border-white animate-bounce"
          >
            <FileText className="w-4 h-4 text-orange-600" />
            Generate Diagnosis Report ({completedCount} Done) 🚀
          </button>
        ) : (
          <div className="text-xs bg-black/15 px-3.5 py-1.5 rounded-xl font-medium text-white/90">
            🎙️ Record any 1 sentence to unlock report
          </div>
        )}
      </div>

      {/* Grid of All 5 Sentences displayed together for easy choice */}
      <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Choose any sentence to practice (All 5 available):
          </h3>
          <span className="text-xs font-semibold text-slate-400">
            Auto audio download on finish 📥
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sentences.map((s) => {
            const isCompleted = !!evaluationsMap[s.id];
            const isCurrent = s.id === selectedSentenceId;
            const evalData = evaluationsMap[s.id];

            return (
              <div
                key={s.id}
                onClick={() => {
                  setSelectedSentenceId(s.id);
                  setRecentEval(evalData || null);
                }}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all relative ${
                  isCurrent
                    ? 'border-blue-500 bg-blue-50/70 shadow-md ring-2 ring-blue-400/30'
                    : isCompleted
                    ? 'border-emerald-300 bg-emerald-50/40 hover:border-emerald-400'
                    : 'border-slate-200 bg-slate-50/50 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase bg-white border border-slate-200 text-slate-600">
                    Sentence #{s.id}
                  </span>
                  {isCompleted ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3" /> Completed ({evalData.clarityPct}% Clarity)
                    </span>
                  ) : (
                    <span className="text-[11px] text-blue-600 font-bold">
                      Tap to Try 🎤
                    </span>
                  )}
                </div>

                <p className="font-bold text-slate-800 text-base leading-snug font-sans">
                  {s.hindi}
                </p>
                <p className="text-xs text-slate-500 italic mt-0.5">
                  "{s.roman}"
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Sentence Practice Card */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border-2 border-indigo-100">
        <div className="flex items-center justify-between mb-4">
          <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 font-extrabold text-xs uppercase tracking-wide">
            Currently Speaking: Sentence #{currentSentence.id}
          </span>
          <button
            onClick={() => playTTSPrompt(currentSentence.hindi)}
            className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-200 transition-all"
          >
            <Volume2 className="w-4 h-4 text-indigo-600" />
            Listen Example 🔊
          </button>
        </div>

        {/* Large Sentence Display */}
        <div className="text-center py-5 px-6 bg-gradient-to-b from-indigo-50/50 to-blue-50/50 rounded-2xl border border-indigo-100/80 mb-6">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-snug font-sans mb-2">
            {currentSentence.hindi}
          </h2>
          <p className="text-base font-semibold text-indigo-700 italic">
            "{currentSentence.roman}"
          </p>
        </div>

        {/* Mic Recording Button Area */}
        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-indigo-200 rounded-3xl bg-slate-50/60 mb-6">
          {!isRecording && !isProcessing && (
            <>
              <button
                disabled={!whisperReady}
                onClick={startRecording}
                className={`w-24 h-24 rounded-full flex flex-col items-center justify-center text-white shadow-xl transition-all duration-300 transform active:scale-90 ${
                  whisperReady
                    ? 'bg-gradient-to-tr from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 hover:scale-105 shadow-pink-500/30'
                    : 'bg-slate-300 cursor-not-allowed shadow-none'
                }`}
              >
                <Mic className="w-10 h-10" />
                <span className="text-[10px] font-bold mt-1 uppercase">Record</span>
              </button>
              <p className="mt-4 text-base font-extrabold text-slate-800">
                {whisperReady ? 'Tap to Speak Sentence' : 'AI Model Initializing...'}
              </p>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
                <Download className="w-3.5 h-3.5 text-blue-500" />
                Will save as: <code className="font-mono font-bold text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">{getAudioFileName(currentSentence.id)}</code>
              </p>
            </>
          )}

          {isRecording && (
            <>
              <div className="relative">
                <span className="absolute -inset-3 rounded-full bg-rose-500/25 animate-ping"></span>
                <button
                  onClick={stopRecording}
                  className="relative w-24 h-24 rounded-full bg-rose-600 text-white flex flex-col items-center justify-center shadow-2xl shadow-rose-600/40 hover:bg-rose-700 active:scale-95"
                >
                  <Square className="w-9 h-9 fill-current" />
                  <span className="text-[10px] font-bold mt-1 uppercase">Stop</span>
                </button>
              </div>
              <p className="mt-4 text-base font-extrabold text-rose-600 animate-pulse flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                Child is Speaking... Tap when finished!
              </p>
            </>
          )}

          {isProcessing && (
            <div className="flex flex-col items-center py-4">
              <div className="w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-3 text-sm font-extrabold text-slate-800">Whisper Devanagari raw transcription...</p>
              <p className="text-xs text-slate-400">Capturing phonetic stutters with ReVoice clarity model</p>
            </div>
          )}
        </div>

        {/* Child Friendly Cheer & Cartoon Celebration Banner */}
        {recentEval && (
          <div className="space-y-5 animate-in fade-in duration-300">
            {/* Encouraging Cartoon Toast */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-100 via-yellow-100 to-orange-100 border border-amber-200 flex items-center gap-4">
              <div className="text-4xl animate-bounce">{cheerMsg.emoji}</div>
              <div>
                <h4 className="font-black text-amber-900 text-base flex flex-wrap items-center gap-2">
                  {cheerMsg.title}
                  <span className="text-xs font-mono font-bold text-amber-900 bg-white/90 px-2.5 py-0.5 rounded-full border border-amber-300">
                    💾 Saved: {recentEval.audioFilename || getAudioFileName(currentSentence.id)}
                  </span>
                </h4>
                <p className="text-xs text-amber-800 font-medium">
                  {cheerMsg.phrase}
                </p>
              </div>
            </div>

            {/* Exactly what the child said (Clean Devanagari Hindi STT) */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
                  Devanagari Hindi Speech Transcript:
                </span>
                <span className="text-xs font-mono font-bold bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full">
                  Browser ASR + Whisper
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-300 text-slate-900 font-sans text-xl font-bold shadow-sm">
                "{recentEval.spokenWhisperText}"
              </div>

              {recentEval.detectedIssues.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {recentEval.detectedIssues.map((issue, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1"
                    >
                      <Activity className="w-3.5 h-3.5 text-amber-600" />
                      {issue}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Metric Meters (ReVoice Clarity Engine) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-center">
                <span className="text-xs font-bold text-slate-500 block mb-1">Acoustic Clarity</span>
                <span className="text-3xl font-black text-indigo-700">{recentEval.clarityPct}%</span>
                <span className="text-[11px] text-indigo-600 block mt-0.5 font-medium">ReVoice Clarity Engine</span>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                <span className="text-xs font-bold text-slate-500 block mb-1">Repetition Score</span>
                <span className="text-3xl font-black text-emerald-700">{recentEval.repetitionPct}%</span>
                <span className="text-[11px] text-emerald-600 block mt-0.5 font-medium">Syllable Consistency</span>
              </div>
              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-center">
                <span className="text-xs font-bold text-slate-500 block mb-1">Sound Sustain</span>
                <span className="text-3xl font-black text-purple-700">{recentEval.prolongationPct}%</span>
                <span className="text-[11px] text-purple-600 block mt-0.5 font-medium">Prolongation Control</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={startRecording}
                className="flex-1 py-3 px-4 rounded-xl border-2 border-slate-300 font-bold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4 text-slate-600" />
                Try Sentence #{currentSentence.id} Again
              </button>

              {currentSentence.id < sentences.length && (
                <button
                  onClick={() => {
                    setSelectedSentenceId(currentSentence.id + 1);
                    setRecentEval(evaluationsMap[currentSentence.id + 1] || null);
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold shadow-md hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  Next: Sentence #{currentSentence.id + 1} ➡️
                </button>
              )}

              <button
                onClick={handleGenerateReportClick}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold shadow-md hover:from-orange-600 hover:to-amber-600 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Generate Diagnosis Report Now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
