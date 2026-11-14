/**
 * Exact Transliteration & Script Mapping logic from ReVoice (speech.ts).
 */

const URDU_TO_DEVA_MAP: Record<string, string> = {
  'آ': 'आ', 'ا': 'ा', 'ب': 'ब', 'پ': 'प', 'ت': 'त', 'ٹ': 'ट', 'ث': 'स',
  'ج': 'ज', 'چ': 'च', 'ح': 'ह', 'خ': 'ख़', 'د': 'द', 'ڈ': 'ड', 'ذ': 'ज़',
  'ر': 'र', 'ڑ': 'ड़', 'ज़': 'ज़', 'ژ': 'झ', 'س': 'स', 'ش': 'श', 'ص': 'स',
  'ض': 'ज़', 'ط': 'त', 'ظ': 'ज़', 'ع': 'अ', 'غ': 'ग़', 'ف': 'फ़', 'ق': 'क़',
  'ک': 'क', 'گ': 'ग', 'ل': 'ल', 'م': 'म', 'न': 'न', 'و': 'व', 'ہ': 'ह',
  'ھ': 'ह', 'ی': 'य', 'ے': 'े', 'ئ': 'य',
  'َ': '', 'ِ': 'ि', 'ُ': 'ु', 'ّ': '', 'ْ': '्'
};

const LATIN_CONSONANTS: [string, string][] = [
  ['chh', '\u091b'], ['ksh', '\u0915\u094d\u0937'],
  ['sh', '\u0936'], ['ch', '\u091a'], ['kh', '\u0916'], ['gh', '\u0918'], ['jh', '\u091d'],
  ['th', '\u0925'], ['dh', '\u0927'], ['ph', '\u092b'], ['bh', '\u092d'], ['tt', '\u091f'], ['dd', '\u0921'],
  ['k', '\u0915'], ['g', '\u0917'], ['c', '\u0915'], ['j', '\u091c'], ['t', '\u0924'], ['d', '\u0926'],
  ['n', '\u0928'], ['p', '\u092a'], ['b', '\u092c'], ['m', '\u092e'], ['y', '\u092f'], ['r', '\u0930'],
  ['l', '\u0932'], ['v', '\u0935'], ['w', '\u0935'], ['s', '\u0938'], ['h', '\u0939'], ['z', '\u091c\u093c'],
  ['f', '\u092b\u093c'], ['q', '\u0915\u093c'],
];

const LATIN_VOWELS: [string, string, string][] = [
  ['aa', '\u0906', '\u093e'], ['ee', '\u0908', '\u0940'], ['ii', '\u0908', '\u0940'], ['oo', '\u090a', '\u0942'],
  ['uu', '\u090a', '\u0942'], ['ai', '\u0910', '\u0948'], ['au', '\u0914', '\u094c'],
  ['a', '\u0905', ''], ['i', '\u0907', '\u093f'], ['u', '\u0909', '\u0941'], ['e', '\u090f', '\u0947'], ['o', '\u0913', '\u094b'],
];

export function hasDevanagari(text: string): boolean {
  return /[\u0900-\u097F]/.test(text);
}

export function isUrduArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

/**
 * Transliterate Urdu/Arabic script from Whisper to Devanagari (from ReVoice speech.ts)
 */
export function urduToDevanagari(s: string): string {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    // Handle digraphs like جھ (jh), چھ (chh), گھ (gh), etc.
    if (ch === 'ھ' && i > 0) {
      const prev = s[i - 1];
      if (prev === 'ج') { out = out.slice(0, -1) + 'झ'; continue; }
      if (prev === 'چ') { out = out.slice(0, -1) + 'छ'; continue; }
      if (prev === 'گ') { out = out.slice(0, -1) + 'घ'; continue; }
      if (prev === 'ک') { out = out.slice(0, -1) + 'ख'; continue; }
      if (prev === 'ب') { out = out.slice(0, -1) + 'भ'; continue; }
      if (prev === 'پ') { out = out.slice(0, -1) + 'फ'; continue; }
      if (prev === 'ت') { out = out.slice(0, -1) + 'थ'; continue; }
      if (prev === 'ٹ') { out = out.slice(0, -1) + 'ठ'; continue; }
      if (prev === 'د') { out = out.slice(0, -1) + 'ध'; continue; }
      if (prev === 'ڈ') { out = out.slice(0, -1) + 'ढ'; continue; }
    }
    
    if (URDU_TO_DEVA_MAP[ch] !== undefined) {
      out += URDU_TO_DEVA_MAP[ch];
    } else {
      out += ch;
    }
  }
  // Word cleanup
  out = out
    .replace(/मझे/g, 'मुझे')
    .replace(/चाये/g, 'चाय')
    .replace(/सोरने/g, 'सोने')
    .replace(/कानी/g, 'कहानी')
    .replace(/सندا/g, 'सुनना')
    .replace(/संग/g, 'सुनना')
    .replace(/पसंदे/g, 'पसंद');
  return out;
}

/**
 * Transliterate romanised Hindi ("mera naam Aarav hai") into Devanagari
 * (from ReVoice speech.ts)
 */
export function latinToDevanagari(s: string): string {
  return s.split(/(\s+)/).map(chunk => {
    if (!chunk.trim()) return chunk;
    const w = chunk.toLowerCase();
    let out = '';
    let i = 0;
    let afterConsonant = false;
    while (i < w.length) {
      const cons = LATIN_CONSONANTS.find(([lat]) => w.startsWith(lat, i));
      if (cons) {
        if (afterConsonant) out += '\u094d';
        out += cons[1];
        afterConsonant = true;
        i += cons[0].length;
        continue;
      }
      const vow = LATIN_VOWELS.find(([lat]) => w.startsWith(lat, i));
      if (vow) {
        const [lat, independent, matra] = vow;
        const isFinalA = lat === 'a' && i + 1 === w.length;
        if (afterConsonant) out += isFinalA ? '\u093e' : matra;
        else out += independent;
        afterConsonant = false;
        i += lat.length;
        continue;
      }
      out += w[i];
      afterConsonant = false;
      i += 1;
    }
    return out;
  }).join('');
}

/**
 * Convert raw Whisper output to clean Devanagari Hindi text
 */
export function ensureDevanagari(text: string): string {
  if (!text || !text.trim()) return text;
  const trimmed = text.trim();

  if (isUrduArabic(trimmed)) {
    return urduToDevanagari(trimmed);
  }

  if (hasDevanagari(trimmed)) {
    return trimmed;
  }

  return latinToDevanagari(trimmed);
}
