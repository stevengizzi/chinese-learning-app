/**
 * Pinyin normalization utilities for comparing user input against correct answers.
 * Handles both tone-number format (wo3) and diacritical format (wǒ).
 */

// Map diacritical vowels back to tone numbers
const diacriticToNumber: Record<string, { base: string; tone: number }> = {
  'ā': { base: 'a', tone: 1 }, 'á': { base: 'a', tone: 2 }, 'ǎ': { base: 'a', tone: 3 }, 'à': { base: 'a', tone: 4 },
  'ē': { base: 'e', tone: 1 }, 'é': { base: 'e', tone: 2 }, 'ě': { base: 'e', tone: 3 }, 'è': { base: 'e', tone: 4 },
  'ī': { base: 'i', tone: 1 }, 'í': { base: 'i', tone: 2 }, 'ǐ': { base: 'i', tone: 3 }, 'ì': { base: 'i', tone: 4 },
  'ō': { base: 'o', tone: 1 }, 'ó': { base: 'o', tone: 2 }, 'ǒ': { base: 'o', tone: 3 }, 'ò': { base: 'o', tone: 4 },
  'ū': { base: 'u', tone: 1 }, 'ú': { base: 'u', tone: 2 }, 'ǔ': { base: 'u', tone: 3 }, 'ù': { base: 'u', tone: 4 },
  'ǖ': { base: 'ü', tone: 1 }, 'ǘ': { base: 'ü', tone: 2 }, 'ǚ': { base: 'ü', tone: 3 }, 'ǜ': { base: 'ü', tone: 4 },
};

/**
 * Converts a single syllable with diacritics to tone-number format.
 * E.g., "wǒ" -> "wo3", "míng" -> "ming2"
 */
function diacriticSyllableToNumbered(syllable: string): string {
  let base = '';
  let tone = 5; // Default to neutral tone

  for (const char of syllable) {
    const mapping = diacriticToNumber[char];
    if (mapping) {
      base += mapping.base;
      tone = mapping.tone;
    } else {
      base += char;
    }
  }

  // Handle v/ü normalization
  base = base.replace(/v/g, 'ü');

  return tone === 5 ? base : `${base}${tone}`;
}

/**
 * Normalizes pinyin input to a canonical tone-number format.
 * Handles:
 * - Diacritical marks (wǒ -> wo3)
 * - v for ü (nv3 -> nü3)
 * - Inconsistent spacing
 * - Case insensitivity
 */
export function normalizePinyin(input: string): string {
  // Convert to lowercase
  let normalized = input.toLowerCase().trim();

  // Strip trailing punctuation (period, question mark, exclamation, comma, etc.)
  normalized = normalized.replace(/[.,!?;:。，！？；：]+$/g, '');

  // Split into syllables (by spaces or lack thereof for diacritics)
  // First, normalize spaces
  normalized = normalized.replace(/\s+/g, ' ');

  // Split by spaces
  const parts = normalized.split(' ');

  // Process each part
  const processedParts = parts.map(part => {
    // Check if it's already in tone-number format (ends with digit)
    if (/[1-5]$/.test(part)) {
      // Already numbered, just normalize v -> ü
      return part.replace(/v/g, 'ü');
    }

    // Check if it contains diacritics
    const hasDiacritics = [...part].some(char => diacriticToNumber[char]);
    if (hasDiacritics) {
      return diacriticSyllableToNumbered(part);
    }

    // No tone marker - treat as neutral tone (5)
    return part.replace(/v/g, 'ü');
  });

  return processedParts.join(' ');
}

/**
 * Compares two pinyin strings for equality after normalization.
 * Returns true if they represent the same pronunciation.
 */
export function comparePinyin(userInput: string, correct: string): boolean {
  const normalizedUser = normalizePinyin(userInput);
  const normalizedCorrect = normalizePinyin(correct);

  return normalizedUser === normalizedCorrect;
}

/**
 * Detailed comparison result for feedback.
 */
export interface PinyinComparisonResult {
  isCorrect: boolean;
  userSyllables: string[];
  correctSyllables: string[];
  syllableResults: {
    user: string;
    correct: string;
    isCorrect: boolean;
    toneError: boolean;  // Syllable correct but tone wrong
  }[];
}

/**
 * Performs detailed syllable-by-syllable comparison.
 */
export function comparePinyinDetailed(userInput: string, correct: string): PinyinComparisonResult {
  const normalizedUser = normalizePinyin(userInput);
  const normalizedCorrect = normalizePinyin(correct);

  const userSyllables = normalizedUser.split(' ').filter(s => s.length > 0);
  const correctSyllables = normalizedCorrect.split(' ').filter(s => s.length > 0);

  const syllableResults: PinyinComparisonResult['syllableResults'] = [];

  const maxLength = Math.max(userSyllables.length, correctSyllables.length);

  for (let i = 0; i < maxLength; i++) {
    const user = userSyllables[i] || '';
    const correct = correctSyllables[i] || '';

    const isCorrect = user === correct;

    // Check if it's just a tone error (same base syllable, different tone)
    const userBase = user.replace(/[1-5]$/, '');
    const correctBase = correct.replace(/[1-5]$/, '');
    const toneError = !isCorrect && userBase === correctBase;

    syllableResults.push({
      user,
      correct,
      isCorrect,
      toneError,
    });
  }

  return {
    isCorrect: normalizedUser === normalizedCorrect,
    userSyllables,
    correctSyllables,
    syllableResults,
  };
}
