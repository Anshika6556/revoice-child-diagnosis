import React from 'react';
import { DiagnosticReport } from '../types';
import {
  FileText,
  LogOut,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Activity,
  HeartPulse,
  Download
} from 'lucide-react';

interface Props {
  report: DiagnosticReport;
  onLogout: () => void;
}

export const ReportView: React.FC<Props> = ({ report, onLogout }) => {
  const { profile, coreDiagnosis, recommendations, sentences } = report;

  const handlePrint = () => {
    window.print();
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 70) return 'text-indigo-600 bg-indigo-50 border-indigo-200';
    if (score >= 55) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  return (
    <div className="max-w-4xl mx-auto my-6 p-6 md:p-10 bg-white rounded-3xl shadow-2xl border border-slate-100 print:shadow-none print:border-none print:p-0">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-6 mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-sm">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              Clinical Speech Analysis & Diagnostic Report
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Acoustic Clarity & Disfluency Diagnostic (Whisper Devanagari Temperature=0)
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold text-white text-sm shadow-md shadow-indigo-500/25 transition-all"
            title="Save as PDF or print paper report"
          >
            <Download className="w-4 h-4" />
            Save as PDF / Print
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 font-bold text-rose-700 text-sm transition-all"
            title="Log out and clear session"
          >
            <LogOut className="w-4 h-4" />
            Logout Session
          </button>
        </div>
      </div>

      {/* Child & Parent Summary Meta */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 p-5 rounded-2xl bg-slate-50 border border-slate-200/80 mb-8">
        <div>
          <span className="text-xs font-semibold text-slate-400 block">Speaker ID</span>
          <span className="text-base font-black text-indigo-700 font-mono">{profile.speakerId || 'SPK10000'}</span>
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-400 block">Child's Name</span>
          <span className="text-base font-bold text-slate-800">{profile.name}</span>
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-400 block">Age & Gender</span>
          <span className="text-base font-bold text-slate-800">{profile.age} Yrs ({profile.gender})</span>
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-400 block">Parent's Name</span>
          <span className="text-base font-bold text-slate-800">{profile.parentName || 'N/A'}</span>
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-400 block">Mobile No.</span>
          <span className="text-base font-bold text-slate-800 font-mono">{profile.parentMobile || 'N/A'}</span>
        </div>
        <div>
          <span className="text-xs font-semibold text-slate-400 block">Assessment Date</span>
          <span className="text-base font-bold text-slate-800">{report.date}</span>
        </div>
      </div>

      {/* Overall Score Summary Cards (Clarity, Repetition, Sustain) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className={`p-6 rounded-3xl border ${getScoreColor(report.overallScore)} flex flex-col justify-between`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider">Overall Clarity Score</span>
            <HeartPulse className="w-5 h-5" />
          </div>
          <div className="text-4xl font-black mb-1">{report.overallScore}/100</div>
          <p className="text-xs opacity-80">Synthesized acoustic accuracy and phoneme precision</p>
        </div>

        <div className="p-6 rounded-3xl border border-emerald-200 bg-emerald-50/60 text-emerald-900 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-700">Repetition Score</span>
            <Activity className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-4xl font-black mb-1 text-emerald-800">{report.avgRepetitionScore}%</div>
          <p className="text-xs text-emerald-600/80">
            Syllable-level consistency & stutter detection
          </p>
        </div>

        <div className="p-6 rounded-3xl border border-purple-200 bg-purple-50/60 text-purple-900 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-purple-700">Sound Sustain Score</span>
            <Activity className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-4xl font-black mb-1 text-purple-800">{report.avgProlongationScore}%</div>
          <p className="text-xs text-purple-600/80">Breath sustain & sound prolongation control</p>
        </div>
      </div>

      {/* Core Diagnostic Section */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-200/80 mb-8">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-md">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <h2 className="text-lg font-bold text-slate-800">
                Diagnostic Finding: <span className="text-amber-800">{coreDiagnosis.primaryIssue}</span>
              </h2>
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-white border border-amber-300 text-amber-800">
                {coreDiagnosis.severity} Degree
              </span>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed mb-4">
              {coreDiagnosis.description}
            </p>

            {/* Diagnostic Flags */}
            <div className="flex flex-wrap gap-2 text-xs">
              <span className={`px-2.5 py-1 rounded-lg border font-semibold ${coreDiagnosis.flags.stuttering ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-white text-slate-400 border-slate-200'}`}>
                {coreDiagnosis.flags.stuttering ? '● Repetition Stutter Detected' : '○ No Syllable Stutter'}
              </span>
              <span className={`px-2.5 py-1 rounded-lg border font-semibold ${coreDiagnosis.flags.prolongation ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-white text-slate-400 border-slate-200'}`}>
                {coreDiagnosis.flags.prolongation ? '● Sound Prolongation Present' : '○ Sound Sustain Normal'}
              </span>
              <span className={`px-2.5 py-1 rounded-lg border font-semibold ${coreDiagnosis.flags.breathSustain ? 'bg-orange-100 text-orange-800 border-orange-300' : 'bg-white text-slate-400 border-slate-200'}`}>
                {coreDiagnosis.flags.breathSustain ? '● Breath Support Attention' : '○ Breath Duration Sufficient'}
              </span>
              <span className={`px-2.5 py-1 rounded-lg border font-semibold ${coreDiagnosis.flags.articulation ? 'bg-indigo-100 text-indigo-800 border-indigo-300' : 'bg-white text-slate-400 border-slate-200'}`}>
                {coreDiagnosis.flags.articulation ? '● Word Articulation Attention' : '○ Clear Phonetic Output'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Per-Sentence Analysis Table */}
      <div className="mb-8">
        <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600" />
          Per-Sentence Devanagari Clarity Breakdown
        </h3>
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold text-xs border-b border-slate-200">
              <tr>
                <th className="p-3.5">#</th>
                <th className="p-3.5">Target Sentence vs Spoken Whisper STT (Devanagari)</th>
                <th className="p-3.5 text-center">Clarity</th>
                <th className="p-3.5 text-center">Repetition</th>
                <th className="p-3.5 text-center">Sustain</th>
                <th className="p-3.5">Observations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {sentences.map((s, idx) => (
                <tr key={s.sentenceId} className="hover:bg-slate-50/50">
                  <td className="p-3.5 font-bold text-slate-400">{idx + 1}</td>
                  <td className="p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-medium">Target: {s.targetSentence}</span>
                      {s.audioFilename && (
                        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                          {s.audioFilename}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-slate-900 mt-0.5 font-sans">
                      "{s.spokenWhisperText}"
                    </p>
                  </td>
                  <td className="p-3.5 text-center">
                    <span className="font-extrabold text-indigo-700">{s.clarityPct}%</span>
                  </td>
                  <td className="p-3.5 text-center">
                    <span className="font-extrabold text-emerald-700">{s.repetitionPct}%</span>
                  </td>
                  <td className="p-3.5 text-center">
                    <span className="font-extrabold text-purple-700">{s.prolongationPct}%</span>
                  </td>
                  <td className="p-3.5">
                    {s.detectedIssues.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {s.detectedIssues.map((iss, i) => (
                          <span key={i} className="text-[11px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            {iss}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                        <CheckCircle className="w-3 h-3" /> Clear & Accurate
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clinical Guidance: How Child Can Speak More Clearly */}
      <div>
        <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          Targeted Speech Therapy & Home Intervention Plan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((rec, i) => (
            <div key={i} className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  {rec.title}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  {rec.advice}
                </p>
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Recommended Home Drills:
                  </span>
                  {rec.activities.map((act, actIdx) => (
                    <div key={actIdx} className="text-xs text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
                      • {act}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
