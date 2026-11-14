import React, { useState, useEffect } from 'react';
import { ChildProfile, SentenceEvaluation, DiagnosticReport } from './types';
import { ASSESSMENT_SENTENCES, generateDiagnosticReport } from './lib/speechAnalysis';
import { initWhisper, getWhisperBackend } from './lib/whisper';
import { saveSpeakerProfile, saveDiagnosticAssessment } from './lib/dbService';
import { SignupConsent } from './components/SignupConsent';
import { SentenceRecorder } from './components/SentenceRecorder';
import { ReportView } from './components/ReportView';

const STORAGE_KEYS = {
  PROFILE: 'revoice_active_profile',
  REPORT: 'revoice_active_report',
  EVALS: 'revoice_active_evals',
};

export function App() {
  // State initialization from localStorage so page reload does NOT lose assessment or report!
  const [profile, setProfile] = useState<ChildProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [report, setReport] = useState<DiagnosticReport | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REPORT);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [whisperReady, setWhisperReady] = useState(false);
  const [whisperStatus, setWhisperStatus] = useState('Initializing AI Model...');

  useEffect(() => {
    // Warm up the Whisper pipeline in background
    initWhisper((prog) => {
      if (prog && prog.status === 'progress') {
        const pct = Math.round((prog.loaded / (prog.total || 1)) * 100);
        setWhisperStatus(`Downloading AI: ${pct}%`);
      }
    })
      .then(() => {
        setWhisperReady(true);
        setWhisperStatus(`Whisper Ready (${getWhisperBackend() || 'Active'})`);
      })
      .catch((err) => {
        console.error('Whisper load error:', err);
        setWhisperStatus('Whisper Offline (Standard analysis)');
        setWhisperReady(true);
      });
  }, []);

  const handleProfileSubmit = (prof: ChildProfile) => {
    setProfile(prof);
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(prof));
    // Save to Supabase speakers table
    saveSpeakerProfile(prof).catch(err => console.warn('[DB] speaker save caught:', err));
  };

  const handleAllSentencesDone = (evaluations: SentenceEvaluation[]) => {
    if (!profile) return;
    const finalReport = generateDiagnosticReport(profile, evaluations);
    setReport(finalReport);
    localStorage.setItem(STORAGE_KEYS.REPORT, JSON.stringify(finalReport));
    localStorage.setItem(STORAGE_KEYS.EVALS, JSON.stringify(evaluations));
    // Save to Supabase diagnostic_assessments table
    saveDiagnosticAssessment(finalReport).catch(err => console.warn('[DB] report save caught:', err));
  };

  // Explicit Logout / Complete Session
  const handleLogout = () => {
    const confirmLogout = window.confirm(
      "Are you sure you want to log out and complete this session?\nMake sure you have saved the PDF Report if needed."
    );
    if (!confirmLogout) return;

    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    localStorage.removeItem(STORAGE_KEYS.REPORT);
    localStorage.removeItem(STORAGE_KEYS.EVALS);
    setProfile(null);
    setReport(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200/80 px-6 py-4 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div>
              <span className="font-extrabold text-2xl text-indigo-700 tracking-tight flex items-center gap-2">
                ReVoice <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold uppercase tracking-wider">Diagnosis</span>
              </span>
              <p className="text-[11px] text-slate-500 font-medium">Child Speech Assessment</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-mono">
              {whisperStatus}
            </span>

            {profile && (
              <button
                onClick={handleLogout}
                className="px-3.5 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all"
              >
                Log Out
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto">
        {!profile && (
          <SignupConsent
            onComplete={handleProfileSubmit}
            whisperStatus={whisperStatus}
          />
        )}

        {profile && !report && (
          <SentenceRecorder
            sentences={ASSESSMENT_SENTENCES}
            onGenerateReport={handleAllSentencesDone}
            whisperReady={whisperReady}
            childName={profile.name}
            speakerId={profile.speakerId}
          />
        )}

        {report && (
          <ReportView
            report={report}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-slate-400 border-t border-slate-200 mt-auto">
        ReVoice Pediatric Speech Assessment &copy; 2026 all rights reserved.
      </footer>
    </div>
  );
}

export default App;
