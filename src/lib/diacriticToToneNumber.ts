/**
 * Converts diacritical pinyin (e.g., "Wǒ de àihào") to tone-number pinyin (e.g., "wo3 de5 ai4 hao4").
 */

// Maps diacritical vowels to their base vowel and tone number
const diacriticMap: Record<string, { vowel: string; tone: number }> = {
  // Tone 1 (macron)
  'ā': { vowel: 'a', tone: 1 },
  'ē': { vowel: 'e', tone: 1 },
  'ī': { vowel: 'i', tone: 1 },
  'ō': { vowel: 'o', tone: 1 },
  'ū': { vowel: 'u', tone: 1 },
  'ǖ': { vowel: 'v', tone: 1 },
  // Tone 2 (acute)
  'á': { vowel: 'a', tone: 2 },
  'é': { vowel: 'e', tone: 2 },
  'í': { vowel: 'i', tone: 2 },
  'ó': { vowel: 'o', tone: 2 },
  'ú': { vowel: 'u', tone: 2 },
  'ǘ': { vowel: 'v', tone: 2 },
  // Tone 3 (caron/háček)
  'ǎ': { vowel: 'a', tone: 3 },
  'ě': { vowel: 'e', tone: 3 },
  'ǐ': { vowel: 'i', tone: 3 },
  'ǒ': { vowel: 'o', tone: 3 },
  'ǔ': { vowel: 'u', tone: 3 },
  'ǚ': { vowel: 'v', tone: 3 },
  // Tone 4 (grave)
  'à': { vowel: 'a', tone: 4 },
  'è': { vowel: 'e', tone: 4 },
  'ì': { vowel: 'i', tone: 4 },
  'ò': { vowel: 'o', tone: 4 },
  'ù': { vowel: 'u', tone: 4 },
  'ǜ': { vowel: 'v', tone: 4 },
  // ü without tone mark (neutral)
  'ü': { vowel: 'v', tone: 5 },
};

/**
 * Converts a single syllable with diacritical marks to tone-number format.
 * e.g., "Wǒ" -> "wo3", "de" -> "de5"
 */
function convertSyllable(syllable: string): string {
  if (!syllable) return '';

  let result = '';
  let tone = 5; // Default to neutral tone

  for (const char of syllable) {
    const mapping = diacriticMap[char] || diacriticMap[char.toLowerCase()];
    if (mapping) {
      result += mapping.vowel;
      tone = mapping.tone;
    } else {
      result += char.toLowerCase();
    }
  }

  return result + tone;
}

/**
 * Splits pinyin string into syllables, handling spaces and combined syllables.
 * e.g., "Wǒ de àihào shì chàng gē" -> ["Wǒ", "de", "ài", "hào", "shì", "chàng", "gē"]
 */
function splitPinyinIntoSyllables(pinyin: string): string[] {
  // Remove punctuation at the end
  const cleaned = pinyin.replace(/[.,!?。，！？]+$/, '').trim();

  // Split by spaces first
  const parts = cleaned.split(/\s+/);
  const syllables: string[] = [];

  for (const part of parts) {
    // Check if this part contains multiple syllables (no space but multiple vowels with tones)
    // Simple heuristic: split compound words by looking for tone-marked vowels
    const syllablesInPart = splitCompoundSyllable(part);
    syllables.push(...syllablesInPart);
  }

  return syllables;
}

/**
 * Checks if a character has a tone diacritic (and thus marks the tone-bearing vowel of a syllable).
 */
function hasToneDiacritic(char: string): boolean {
  const mapping = diacriticMap[char] || diacriticMap[char.toLowerCase()];
  // Has a diacritic if it maps to something AND tone is not 5 (neutral/unmarked)
  return mapping !== undefined && mapping.tone !== 5;
}

/**
 * Checks if a character is a plain (non-diacritical) a, e, or o.
 * These are the only vowels that can start a new syllable in compounds.
 */
function isPlainVowelStarter(char: string): boolean {
  const c = char.toLowerCase();
  // Must be exactly a, e, or o - NOT a diacritical version
  return ['a', 'e', 'o'].includes(c) && !diacriticMap[char] && !diacriticMap[char.toLowerCase()];
}

/**
 * Checks if a string starts with a pinyin initial consonant (case-insensitive).
 * Returns the length of the initial if found, 0 otherwise.
 */
function startsWithInitial(str: string): number {
  const lower = str.toLowerCase();
  // Check longer initials first
  const initials = [
    'zh', 'ch', 'sh',
    'b', 'p', 'm', 'f',
    'd', 't', 'n', 'l',
    'g', 'k', 'h',
    'j', 'q', 'x',
    'z', 'c', 's',
    'r', 'y', 'w'
  ];

  for (const initial of initials) {
    if (lower.startsWith(initial)) {
      return initial.length;
    }
  }
  return 0;
}

/**
 * Checks if a character is a consonant (not a vowel).
 */
function isConsonant(char: string): boolean {
  return !isVowelChar(char);
}

/**
 * Attempts to split a compound syllable like "àihào" into ["ài", "hào"].
 * Uses pinyin syllable patterns to identify boundaries.
 *
 * Strategy: A syllable is complete when we've seen its tone-marked vowel
 * AND we encounter a consonant that starts a new syllable (followed by a vowel).
 * Vowels following the tone-marked vowel are part of the same syllable's final.
 */
function splitCompoundSyllable(compound: string): string[] {
  if (!compound) return [];

  const result: string[] = [];
  let remaining = compound;

  while (remaining.length > 0) {
    // Find where the next syllable ends
    let syllableEnd = remaining.length;

    // Track if we've seen the tone-marked vowel in this potential syllable
    let seenToneMarker = false;
    // Track if we've seen a consonant AFTER the tone marker (potential new syllable)
    let seenConsonantAfterTone = false;

    // Skip the initial consonant(s) at the start of this syllable
    const initialLen = startsWithInitial(remaining);
    const startSearch = Math.max(1, initialLen);

    // Look for the start of another syllable
    for (let i = startSearch; i < remaining.length; i++) {
      const currChar = remaining[i];
      const prevChar = remaining[i - 1];

      // Track if we've passed a tone-marked vowel
      if (hasToneDiacritic(prevChar)) {
        seenToneMarker = true;
      }

      // Track if we've seen a consonant after the tone marker
      if (seenToneMarker && isConsonant(currChar)) {
        seenConsonantAfterTone = true;
      }

      // Only look for syllable boundaries AFTER we've seen BOTH the tone marker AND a consonant
      // This ensures vowels like 'o' in 'hào' stay with their syllable
      if (!seenToneMarker) continue;

      // Check if this position starts with an initial followed by a vowel
      // This is the primary way syllables are split
      const restOfString = remaining.substring(i);
      const nextInitialLen = startsWithInitial(restOfString);
      if (nextInitialLen > 0) {
        // Check if there's a vowel after the initial
        const afterInitial = restOfString.substring(nextInitialLen);
        if (afterInitial.length > 0 && isVowelChar(afterInitial[0])) {
          syllableEnd = i;
          break;
        }
      }

      // For vowel-starting syllables (only plain a, e, o), we must have
      // seen a consonant between the tone marker and this vowel
      // This handles cases like "xī'ān" (西安) but not "hào" where 'o' follows 'à' directly
      if (seenConsonantAfterTone && isPlainVowelStarter(currChar)) {
        syllableEnd = i;
        break;
      }
    }

    result.push(remaining.substring(0, syllableEnd));
    remaining = remaining.substring(syllableEnd);
  }

  return result;
}

/**
 * Checks if a character is a vowel (including diacritical versions).
 */
function isVowelChar(char: string): boolean {
  const c = char.toLowerCase();
  if ('aeiouü'.includes(c)) return true;
  return !!diacriticMap[c];
}

/**
 * Converts a full diacritical pinyin string to tone-number format.
 * e.g., "Wǒ de àihào shì chàng gē." -> "wo3 de5 ai4 hao4 shi4 chang4 ge1"
 */
export function convertDiacriticToToneNumber(pinyin: string): string {
  const syllables = splitPinyinIntoSyllables(pinyin);
  return syllables.map(s => convertSyllable(s)).join(' ');
}

/**
 * Extracts tone numbers from a tone-number pinyin string.
 * e.g., "wo3 de5 ai4 hao4" -> [3, 5, 4, 4]
 * Syllables without a tone number are treated as neutral tone (5).
 * e.g., "mei2 guan1 xi" -> [2, 1, 5]
 */
export function extractTonesFromNumberedPinyin(pinyin: string): number[] {
  const tones: number[] = [];
  const syllables = pinyin.split(/\s+/).filter(s => s.length > 0);

  for (const syllable of syllables) {
    // Find the tone number at the end of the syllable
    const match = syllable.match(/(\d)$/);
    if (match) {
      tones.push(parseInt(match[1], 10));
    } else {
      // No tone number = neutral tone (5)
      tones.push(5);
    }
  }

  return tones;
}

/**
 * Extracts tone numbers directly from diacritical pinyin.
 * e.g., "Wǒ de àihào" -> [3, 5, 4, 4]
 */
export function extractTonesFromDiacriticPinyin(pinyin: string): number[] {
  const numbered = convertDiacriticToToneNumber(pinyin);
  return extractTonesFromNumberedPinyin(numbered);
}
