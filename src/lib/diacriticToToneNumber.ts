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
 * Attempts to split a compound syllable like "àihào" into ["ài", "hào"].
 * Uses pinyin syllable patterns to identify boundaries.
 */
function splitCompoundSyllable(compound: string): string[] {
  if (!compound) return [];

  // Common pinyin initials (consonant clusters that start syllables)
  const initials = [
    'zh', 'ch', 'sh', 'ng',
    'b', 'p', 'm', 'f',
    'd', 't', 'n', 'l',
    'g', 'k', 'h',
    'j', 'q', 'x',
    'z', 'c', 's',
    'r', 'y', 'w'
  ];

  const result: string[] = [];
  let remaining = compound;

  while (remaining.length > 0) {
    // Find where the next syllable starts
    let syllableEnd = remaining.length;

    // Look for the start of another syllable after the first character
    for (let i = 1; i < remaining.length; i++) {
      const substring = remaining.substring(i).toLowerCase();

      // Check if this position starts with an initial
      for (const initial of initials) {
        if (substring.startsWith(initial)) {
          // Make sure there's more after the initial (a vowel)
          const afterInitial = substring.substring(initial.length);
          if (afterInitial.length > 0 && isVowelChar(afterInitial[0])) {
            syllableEnd = i;
            break;
          }
        }
      }

      // Also check for vowel-starting syllables (a, e, o can start syllables in compounds)
      // but only if preceded by a vowel (syllable boundary)
      if (syllableEnd === remaining.length && i > 0) {
        const prevChar = remaining[i - 1].toLowerCase();
        const currChar = remaining[i].toLowerCase();
        // If previous is vowel and current is 'a', 'e', or 'o', likely a boundary
        if (isVowelChar(prevChar) && ['a', 'e', 'o'].includes(getNormalizedVowel(currChar))) {
          syllableEnd = i;
          break;
        }
      }

      if (syllableEnd < remaining.length) break;
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
 * Gets the normalized (no-diacritic) vowel for a character.
 */
function getNormalizedVowel(char: string): string {
  const mapping = diacriticMap[char] || diacriticMap[char.toLowerCase()];
  if (mapping) return mapping.vowel;
  return char.toLowerCase();
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
 */
export function extractTonesFromNumberedPinyin(pinyin: string): number[] {
  const tones: number[] = [];
  const syllables = pinyin.split(/\s+/);

  for (const syllable of syllables) {
    // Find the tone number at the end of the syllable
    const match = syllable.match(/(\d)$/);
    if (match) {
      tones.push(parseInt(match[1], 10));
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
