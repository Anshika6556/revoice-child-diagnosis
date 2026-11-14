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
}
