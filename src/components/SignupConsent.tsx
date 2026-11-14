import React, { useState } from 'react';
import { ChildProfile } from '../types';
import { ShieldCheck, User, Calendar, Phone, HeartHandshake } from 'lucide-react';

interface Props {
  onComplete: (profile: ChildProfile) => void;
  whisperStatus: string;
}

export const SignupConsent: React.FC<Props> = ({ onComplete, whisperStatus }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState<number>(6);
  const [gender, setGender] = useState('Male');
  const [parentName, setParentName] = useState('');
  const [parentMobile, setParentMobile] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');

  // Speaker ID starting from SPK10000, persistent and increments per new child
  const [speakerId] = useState<string>(() => {
    const saved = localStorage.getItem('last_speaker_num');
    const num = saved ? parseInt(saved, 10) : 10000;
    return `SPK${num}`;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter the child's name.");
      return;
    }
    if (!parentName.trim()) {
      setError("Please enter the parent/guardian's name.");
      return;
    }
    if (!parentMobile.trim() || parentMobile.trim().length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!consent) {
      setError('Please check the parent/guardian consent checkbox.');
      return;
    }
    setError('');

    // Increment speaker number for the next child
    const currentNum = parseInt(speakerId.replace('SPK', ''), 10);
    localStorage.setItem('last_speaker_num', (currentNum + 1).toString());

    onComplete({
      name: name.trim(),
      age: Number(age),
      gender,
      parentName: parentName.trim(),
      parentMobile: parentMobile.trim(),
      consent,
      speakerId
    });
  };

  return (
    <div className="max-w-xl mx-auto my-8 p-8 bg-white/95 backdrop-blur-md rounded-3xl shadow-xl border border-blue-100 transition-all">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Child Speech Analysis</h1>
        <p className="text-sm text-slate-500">Clinical Vocal Clarity Diagnostic</p>
      </div>

      <div className="mb-6 p-4 rounded-2xl bg-blue-50/70 border border-blue-100/80 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-blue-800 gap-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
          </span>
          <span className="font-semibold">AI Whisper:</span>
          <span className="font-mono text-xs bg-white/80 px-2 py-0.5 rounded-full border border-blue-200">
            {whisperStatus}
          </span>
        </div>
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <span className="text-slate-500 font-medium">Assigned Speaker ID:</span>
          <span className="font-mono font-black text-xs bg-indigo-600 text-white px-2.5 py-0.5 rounded-md shadow-xs">
            {speakerId}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Child's Details */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <User className="w-4 h-4 text-blue-600" />
            Child's Full Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Aman Verma"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-slate-800"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-600" />
              Age (Years)
            </label>
            <input
              type="number"
              min={3}
              max={16}
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-slate-800"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-slate-800 bg-white"
            >
              <option value="Male">Boy (Male)</option>
              <option value="Female">Girl (Female)</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Parent / Guardian Information */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <User className="w-4 h-4 text-indigo-600" />
            Parent / Guardian's Full Name
          </label>
          <input
            type="text"
            required
            value={parentName}
            onChange={(e) => setParentName(e.target.value)}
            placeholder="e.g. Rajesh Verma"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-slate-800"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Phone className="w-4 h-4 text-indigo-600" />
            Mobile Number
          </label>
          <input
            type="tel"
            required
            pattern="[0-9]{10}"
            value={parentMobile}
            onChange={(e) => setParentMobile(e.target.value)}
            placeholder="e.g. 9876543210"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-slate-800 font-mono"
          />
        </div>

        {/* Legal Consent Checkbox */}
        <div className="pt-1">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <div className="text-xs text-slate-600 leading-relaxed select-none">
                <span className="font-semibold text-slate-800 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Parent / Guardian Consent
                </span>
                I confirm that I am the parent or authorized guardian and above 18 years of age. I consent to provide voice recording and AI analysis for evaluating speech clarity diagnostics of my child. I understand that the data will be used solely for research and clinical purposes, and will not be shared with third parties without my consent.
              </div>
            </label>
          </div>
        </div>

        {error && (
          <p className="text-xs font-medium text-rose-600 bg-rose-50 px-3 py-2 rounded-lg border border-rose-100">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-base"
        >
          <HeartHandshake className="w-5 h-5" />
          Start Speech Assessment
        </button>
      </form>
    </div>
  );
};
