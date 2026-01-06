// Maps for converting vowels to their tone-marked versions
const toneMap: Record<string, string[]> = {
  'a': ['ā', 'á', 'ǎ', 'à', 'a'],
  'e': ['ē', 'é', 'ě', 'è', 'e'],
  'i': ['ī', 'í', 'ǐ', 'ì', 'i'],
  'o': ['ō', 'ó', 'ǒ', 'ò', 'o'],
  'u': ['ū', 'ú', 'ǔ', 'ù', 'u'],
  'ü': ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],
  'v': ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'], // v is sometimes used for ü
};

/**
 * Converts numbered pinyin (e.g., "ling2") to pinyin with tone marks (e.g., "líng")
 *
 * Rules for tone mark placement:
 * 1. Vowels (a, e, i, o, u, ü) get the marks
 * 2. "a" or "e" always gets the tone mark (no pinyin has both a and e)
 * 3. If you see "ou" or "uo," then "o" gets the mark
 * 4. The final vowel gets the tone mark in all other cases
 */
export function convertNumberedPinyinToToneMarks(numberedPinyin: string): string {
  // Extract tone number (1-4) or neutral tone (5 or no number)
  const match = numberedPinyin.match(/^([a-zü]+)([1-5]?)$/i);

  if (!match) {
    // If no match, return as-is (might already have tone marks or be invalid)
    return numberedPinyin;
  }

  const [, syllable, toneNumber] = match;
  const tone = toneNumber ? parseInt(toneNumber, 10) - 1 : 4; // 0-3 for tones 1-4, 4 for neutral

  // Convert to lowercase for processing
  const lowerSyllable = syllable.toLowerCase();

  // Find which vowel should get the tone mark
  let targetIndex = -1;

  // Rule 2: "a" or "e" always gets the tone mark
  if (lowerSyllable.includes('a')) {
    targetIndex = lowerSyllable.indexOf('a');
  } else if (lowerSyllable.includes('e')) {
    targetIndex = lowerSyllable.indexOf('e');
  }
  // Rule 3: "ou" -> "o" gets the mark, "uo" -> "o" gets the mark
  else if (lowerSyllable.includes('ou')) {
    targetIndex = lowerSyllable.indexOf('o'); // Find the 'o' in 'ou'
  } else if (lowerSyllable.includes('uo')) {
    targetIndex = lowerSyllable.indexOf('o'); // Find the 'o' in 'uo'
  }
  // Rule 4: Final vowel gets the mark
  else {
    // Find the last vowel (rightmost vowel in the syllable)
    const vowels = ['i', 'o', 'u', 'ü', 'v']; // Order doesn't matter here
    let lastVowelIndex = -1;

    for (let i = lowerSyllable.length - 1; i >= 0; i--) {
      if (vowels.includes(lowerSyllable[i])) {
        lastVowelIndex = i;
        break;
      }
    }

    targetIndex = lastVowelIndex;
  }

  if (targetIndex === -1) {
    // No vowel found, return as-is
    return syllable;
  }

  // Get the vowel to replace
  const vowelToReplace = lowerSyllable[targetIndex];
  const vowelKey = vowelToReplace === 'v' ? 'v' : vowelToReplace;

  if (!toneMap[vowelKey]) {
    return syllable;
  }

  // Get the tone-marked vowel
  const toneMarkedVowel = toneMap[vowelKey][tone];

  // Replace the vowel at the target index
  const result = syllable.substring(0, targetIndex) +
                 toneMarkedVowel +
                 syllable.substring(targetIndex + 1);

  return result;
}

/**
 * Converts a full pinyin string that may contain multiple syllables
 * Example: "wo3 ming2 bai2" -> "wǒ míng bái"
 */
export function convertPinyinStringToToneMarks(pinyinString: string): string {
  // Split by spaces and convert each syllable
  return pinyinString
    .split(/\s+/)
    .map(syllable => convertNumberedPinyinToToneMarks(syllable))
    .join(' ');
}
