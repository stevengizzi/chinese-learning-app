import type { TonedSyllable, GeneratedSequence, ToneSequenceConfig } from '../../types/toneSequence';
import { getSyllablesByDifficulty, filterExcludedSyllables } from './syllableInventory';
import { applySandhiRules } from './toneSandhiRules';
import { convertNumberedPinyinToToneMarks } from '../pinyinToneConverter';

/**
 * Generate a random tone sequence based on configuration
 */
export function generateToneSequence(config: ToneSequenceConfig): GeneratedSequence {
  const { activeTones, difficultyRange, excludedSyllables, sandhiRules, sequenceLength } = config;

  // 1. Filter syllables by difficulty
  let availableSyllables = getSyllablesByDifficulty(difficultyRange[0], difficultyRange[1]);

  // 2. Exclude user-specified syllables
  availableSyllables = filterExcludedSyllables(availableSyllables, excludedSyllables);

  if (availableSyllables.length === 0) {
    throw new Error('No syllables available with current filters');
  }

  // 3. Convert activeTones Set to array for random selection
  const toneArray = Array.from(activeTones);

  if (toneArray.length === 0) {
    throw new Error('No tones selected');
  }

  // 4. Generate random sequence
  const syllables: TonedSyllable[] = [];

  for (let i = 0; i < sequenceLength; i++) {
    // Random syllable
    const randomSyllable = availableSyllables[Math.floor(Math.random() * availableSyllables.length)];

    // Random tone from active tones
    const randomTone = toneArray[Math.floor(Math.random() * toneArray.length)];

    // Convert to pinyin with tone marks
    const numberedPinyin = `${randomSyllable.pinyin}${randomTone}`;
    const pinyinWithTone = convertNumberedPinyinToToneMarks(numberedPinyin);

    syllables.push({
      syllable: randomSyllable.pinyin,
      tone: randomTone,
      pinyinWithTone,
    });
  }

  // 5. Apply sandhi rules to generate explanation
  const sandhiExplanation = applySandhiRules(syllables, sandhiRules);

  return {
    syllables,
    sandhiExplanation,
  };
}
