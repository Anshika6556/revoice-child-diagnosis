/**
 * Speech-sound (articulation) scoring for Hindi.
 *
 * Works on Devanagari consonants only: vowel signs and nasal marks are where
 * ASR output varies most, so ignoring them keeps the score about the sounds a
 * child substitutes or drops (र→ल, स→थ, cluster reduction …).
 *
 * Caveat: ASR leans towards real words, so it may "correct" a mispronunciation.
 * The examiner override on each picture-naming item exists for that reason.
 */

const isConsonant = (ch: string) => ch >= 'क' && ch <= 'ह';

/**
 * The nukta is ignored: क़ ख़ ग़ ज़ फ़ are commonly said without it (not an error),
 * and ASR often writes ड़/ढ़ as ड/ढ, which would otherwise count as false errors.
 */
export function consonants(word: string): string[] {
  const out: string[] = [];
  for (const ch of word.normalize('NFC')) {
    if (isConsonant(ch)) out.push(ch);
  }
  return out;
}

/** Levenshtein alignment; returns target consonants that were matched / missed. */
export function alignConsonants(target: string[], heard: string[]) {
  const n = target.length;
  const m = heard.length;
  const d: number[][] = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: m + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const sub = d[i - 1][j - 1] + (target[i - 1] === heard[j - 1] ? 0 : 1);
      d[i][j] = Math.min(sub, d[i - 1][j] + 1, d[i][j - 1] + 1);
    }
  }
  const missed: string[] = [];
  let correct = 0;
  let i = n;
  let j = m;
  while (i > 0) {
    if (j > 0 && d[i][j] === d[i - 1][j - 1] + (target[i - 1] === heard[j - 1] ? 0 : 1)) {
      if (target[i - 1] === heard[j - 1]) correct++;
      else missed.push(target[i - 1]);
      i--;
      j--;
    } else if (j > 0 && d[i][j] === d[i][j - 1] + 1) {
      j--;
    } else {
      missed.push(target[i - 1]);
      i--;
    }
  }
  return { correct, missed: missed.reverse() };
}

// ---------------------------------------------------------------------------
// Sentence word accuracy
// ---------------------------------------------------------------------------

const skeleton = (w: string) => consonants(w).join('');
const sameWord = (a: string, b: string) => a === b || (skeleton(a) !== '' && skeleton(a) === skeleton(b));

/**
 * Share of prompt words the child produced (in order). Extra words such as
 * stutter repetitions are not penalised here — repetition scoring covers them.
 */
export function wordAccuracy(promptTokens: string[], spokenTokens: string[]) {
  if (promptTokens.length === 0) return { accuracyPct: 100, missedWords: [] as string[] };
  const n = promptTokens.length;
  const m = spokenTokens.length;
  const L: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      L[i][j] = sameWord(promptTokens[i - 1], spokenTokens[j - 1])
        ? L[i - 1][j - 1] + 1
        : Math.max(L[i - 1][j], L[i][j - 1]);
    }
  }
  const matched = new Set<number>();
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    if (sameWord(promptTokens[i - 1], spokenTokens[j - 1]) && L[i][j] === L[i - 1][j - 1] + 1) {
      matched.add(i - 1);
      i--;
      j--;
    } else if (L[i - 1][j] >= L[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  return {
    accuracyPct: Math.round((matched.size / n) * 100),
    missedWords: promptTokens.filter((_, k) => !matched.has(k)),
  };
}

// ---------------------------------------------------------------------------
// Picture naming
// ---------------------------------------------------------------------------

export interface PictureWord {
  id: number;
  word: string;
  roman: string;
  emoji: string;
  /** Accepted other names (synonyms / English loanwords) — counted as correct. */
  alternates?: string[];
}

/** 22 pictureable words covering the common Hindi consonants in different word positions. */
export const PICTURE_WORDS: PictureWord[] = [
  { id: 1, word: 'सेब', roman: 'seb', emoji: '🍎', alternates: ['सेव', 'एप्पल', 'ऐपल'] },
  { id: 2, word: 'केला', roman: 'kela', emoji: '🍌' },
  { id: 3, word: 'घर', roman: 'ghar', emoji: '🏠', alternates: ['मकान'] },
  { id: 4, word: 'मछली', roman: 'machhli', emoji: '🐟' },
  { id: 5, word: 'बिल्ली', roman: 'billi', emoji: '🐱' },
  { id: 6, word: 'कुत्ता', roman: 'kutta', emoji: '🐶' },
  { id: 7, word: 'गाय', roman: 'gaay', emoji: '🐄' },
  { id: 8, word: 'हाथी', roman: 'haathi', emoji: '🐘' },
  { id: 9, word: 'पानी', roman: 'paani', emoji: '💧', alternates: ['जल'] },
  { id: 10, word: 'चाँद', roman: 'chaand', emoji: '🌙', alternates: ['चंदा', 'चंद्रमा', 'चांद'] },
  { id: 11, word: 'सूरज', roman: 'sooraj', emoji: '☀️' },
  { id: 12, word: 'फूल', roman: 'phool', emoji: '🌸' },
  { id: 13, word: 'तारा', roman: 'taara', emoji: '⭐' },
  { id: 14, word: 'पेड़', roman: 'ped', emoji: '🌳' },
  { id: 15, word: 'गाड़ी', roman: 'gaadi', emoji: '🚗', alternates: ['कार'] },
  { id: 16, word: 'टमाटर', roman: 'tamatar', emoji: '🍅' },
  { id: 17, word: 'झंडा', roman: 'jhanda', emoji: '🚩' },
  { id: 18, word: 'शेर', roman: 'sher', emoji: '🦁' },
  { id: 19, word: 'भालू', roman: 'bhaalu', emoji: '🐻' },
  { id: 20, word: 'दूध', roman: 'doodh', emoji: '🥛' },
  { id: 21, word: 'खरगोश', roman: 'khargosh', emoji: '🐰' },
  { id: 22, word: 'चिड़िया', roman: 'chidiya', emoji: '🐦' },
];

/** Scores one naming attempt against all candidate transcripts; keeps the best reading. */
export function scoreNamingAttempt(item: PictureWord, transcripts: string[]) {
  const target = consonants(item.word);
  const candidates: string[] = [];
  for (const t of transcripts) {
    const clean = t.replace(/[^\p{L}\p{M}\s]/gu, ' ').trim();
    if (!clean) continue;
    candidates.push(...clean.split(/\s+/), clean.replace(/\s+/g, ''));
  }

  if (candidates.some((c) => item.alternates?.some((alt) => sameWord(alt, c)))) {
    return { consonantsTotal: target.length, consonantsCorrect: target.length, missedSounds: [] as string[] };
  }

  let best = { correct: 0, missed: target };
  for (const c of candidates) {
    const res = alignConsonants(target, consonants(c));
    if (res.correct > best.correct) best = res;
  }
  return { consonantsTotal: target.length, consonantsCorrect: best.correct, missedSounds: best.missed };
}
