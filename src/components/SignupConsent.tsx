import React, { useState } from 'react';
import { ChildProfile } from '../types';
import {
  ShieldCheck,
  User,
  Phone,
  Baby,
  Sparkles,
  ClipboardList,
  Mic,
  FileBarChart,
  Lightbulb,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

interface Props {
  onComplete: (profile: ChildProfile) => void;
  whisperStatus: string;
}

const GENDER_OPTIONS = [
  { value: 'Male', label: 'Boy' },
  { value: 'Female', label: 'Girl' },
  { value: 'Other', label: 'Other' },
];

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

  const modelReady = whisperStatus.startsWith('Whisper Ready');

  return (
    <div className="grid lg:grid-cols-5 gap-6 lg:gap-10 items-start max-w-5xl mx-auto animate-fade-up">
      {/* Intro */}
      <section className="lg:col-span-2 lg:sticky lg:top-24 space-y-6 pt-2">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> Hindi speech check-up
          </span>
          <h1 className="mt-3 text-3xl md:text-4xl font-bold text-slate-900 tracking-tight leading-[1.1]">
            Child Speech Analysis
          </h1>
          <p className="mt-2 text-slate-600 leading-relaxed">
            A short, playful clarity check. Your child reads five simple Hindi sentences aloud and you get a clear report with home practice ideas.
          </p>
        </div>

        <ol className="space-y-3">
          {[
            { icon: ClipboardList, title: 'Add details', text: 'Child and guardian information with consent.' },
            { icon: Mic, title: 'Record sentences', text: 'Speak any of the 5 sentences — retry anytime.' },
            { icon: FileBarChart, title: 'Get the report', text: 'Clarity scores, findings and a home plan.' },
          ].map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="flex gap-3">
              <span className="w-9 h-9 shrink-0 rounded-xl bg-white border border-slate-200 shadow-card flex items-center justify-center text-brand-600">
                <Icon className="w-[18px] h-[18px]" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  <span className="text-slate-400 mr-1">{i + 1}.</span>
                  {title}
                </p>
                <p className="text-sm text-slate-500">{text}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/70 text-sm text-amber-900 flex gap-3">
          <Lightbulb className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
          <p>
            <strong className="font-semibold">Tip:</strong> Find a quiet room and hold the device about an arm’s length from your child.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="lg:col-span-3 card p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-6 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="relative flex h-2.5 w-2.5">
              {!modelReady && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${modelReady ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <span className="font-medium">{whisperStatus}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Speaker ID</span>
            <span className="font-mono font-bold text-brand-700 bg-brand-50 border border-brand-100 px-2 py-0.5 rounded-md">
              {speakerId}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-7">
          {/* Child's Details */}
          <fieldset className="space-y-4">
            <legend className="eyebrow mb-3 flex items-center gap-2">
              <Baby className="w-4 h-4 text-brand-500" /> About the child
            </legend>
            <div>
              <label htmlFor="child-name" className="label">Full name</label>
              <input
                id="child-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aman Verma"
                className="field"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[8rem_1fr] gap-4">
              <div>
                <label htmlFor="child-age" className="label">Age (years)</label>
                <input
                  id="child-age"
                  type="number"
                  min={3}
                  max={16}
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="field tabular-nums"
                />
              </div>

              <div>
                <span className="label" id="gender-label">Gender</span>
                <div role="radiogroup" aria-labelledby="gender-label" className="grid grid-cols-3 gap-1 p-1 h-12 rounded-xl bg-slate-100">
                  {GENDER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={gender === opt.value}
                      onClick={() => setGender(opt.value)}
                      className={`rounded-lg text-sm font-semibold transition ${
                        gender === opt.value ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </fieldset>

          {/* Parent / Guardian Information */}
          <fieldset className="space-y-4">
            <legend className="eyebrow mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-brand-500" /> Parent / guardian
            </legend>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="parent-name" className="label">Full name</label>
                <input
                  id="parent-name"
                  type="text"
                  required
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="e.g. Rajesh Verma"
                  className="field"
                />
              </div>

              <div>
                <label htmlFor="parent-mobile" className="label">Mobile number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="parent-mobile"
                    type="tel"
                    inputMode="numeric"
                    required
                    pattern="[0-9]{10}"
                    value={parentMobile}
                    onChange={(e) => setParentMobile(e.target.value)}
                    placeholder="9876543210"
                    className="field pl-10 tabular-nums tracking-wide"
                  />
                </div>
              </div>
            </div>
          </fieldset>

          {/* Legal Consent Checkbox */}
          <label
            className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition ${
              consent ? 'bg-emerald-50/60 border-emerald-300' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 w-5 h-5 shrink-0 accent-emerald-600 cursor-pointer"
            />
            <div className="text-sm text-slate-600 leading-relaxed select-none">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Parent / Guardian Consent
              </span>
              I confirm that I am the parent or authorized guardian and above 18 years of age. I consent to provide voice recording and AI analysis for evaluating speech clarity diagnostics of my child. I understand that the data will be used solely for research and clinical purposes, and will not be shared with third parties without my consent.
            </div>
          </label>

          {error && (
            <p role="alert" className="flex items-center gap-2 text-sm font-medium text-rose-700 bg-rose-50 px-4 py-3 rounded-xl border border-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary w-full h-14 text-base">
            Start Speech Assessment
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </section>
    </div>
  );
};
