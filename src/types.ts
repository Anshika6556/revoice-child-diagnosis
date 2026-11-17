export interface ChildProfile {
  name: string;
  age: number;
  gender: string;
  parentName: string;
  parentMobile: string;
  consent: boolean;
  speakerId: string;
}

export interface SentenceItem {
  id: number;
  hindi: string;
  roman: string;
  translation: string;
}

export interface SentenceEvaluation {
  sentenceId: number;
  speakerId?: string;
  audioFilename?: string;
  targetSentence: string;
  spokenWhisperText: string;
  spokenBrowserText?: string;
  durationMs: number;
  clarityPct: number;
  repetitionPct: number;
  prolongationPct: number;
  detectedIssues: string[];
  feedback: string;
  // Added by the screening protocol (optional so older saved reports still load)
  accuracyPct?: number;
  missedWords?: string[];
  longestPauseMs?: number;
  pauseCount?: number;
  snrDb?: number;
}

export interface DiagnosticReport {
  profile: ChildProfile;
  date: string;
  overallScore: number;
  overallClarity: number;
  avgRepetitionScore: number;
  avgProlongationScore: number;
  sentences: SentenceEvaluation[];
  coreDiagnosis: {
    primaryIssue: string;
    severity: 'Mild' | 'Moderate' | 'Noticeable' | 'Optimal';
    description: string;
    flags: {
      stuttering: boolean;
      prolongation: boolean;
      breathSustain: boolean;
      articulation: boolean;
    };
  };
  recommendations: {
    title: string;
    advice: string;
    activities: string[];
  }[];
  avgAccuracy?: number;
  tasks?: ScreeningTasks;
  screening?: ScreeningSummary;
}

// ---- Screening protocol tasks ----

/** Sustained "आ" — breath support (maximum phonation time) and voice quality. */
export interface VoiceAttempt {
  attempt: number;
  mptSec: number;
  f0Hz: number;
  jitterPct: number;
  shimmerPct: number;
  hnrDb: number;
  snrDb: number;
  audioFilename?: string;
}

/** Diadochokinetic task: AMR = "पा-पा-पा", SMR = "पा-टा-का". */
export interface DdkResult {
  kind: 'amr' | 'smr';
  syllables: number;
  durationSec: number;
  ratePerSec: number;
  regularityCv: number;
  snrDb: number;
  sequenceCorrect?: boolean;
  audioFilename?: string;
}

/** One picture-naming item, scored by consonants correct. */
export interface NamingItem {
  id: number;
  target: string;
  heard: string;
  consonantsTotal: number;
  consonantsCorrect: number;
  missedSounds: string[];
  examinerOverride?: 'correct' | 'error';
  /** Nothing was recognised — excluded from scoring unless the examiner marks it. */
  noResponse?: boolean;
  audioFilename?: string;
}

export interface ScreeningTasks {
  voice?: VoiceAttempt[];
  ddk?: { amr?: DdkResult; smr?: DdkResult };
  naming?: NamingItem[];
}

export type ScreeningStatus = 'typical' | 'monitor' | 'refer' | 'inconclusive' | 'not_tested';

export interface ScreeningDomain {
  key: 'fluency' | 'sounds' | 'voice' | 'breath' | 'motor';
  label: string;
  status: ScreeningStatus;
  measure: string;
  note: string;
}

export interface ScreeningSummary {
  overall: ScreeningStatus;
  ageBand: string;
  domains: ScreeningDomain[];
}
