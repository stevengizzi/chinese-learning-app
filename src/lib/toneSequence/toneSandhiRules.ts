import type { ToneSandhiRule, TonedSyllable } from '../../types/toneSequence';

/**
 * Tone Sandhi Rules for Mandarin Chinese
 *
 * These rules describe pronunciation changes that occur when certain tone
 * sequences appear. The rules check the underlying tone sequence but do NOT
 * modify the displayed pinyin - they only generate explanatory text.
 *
 * Each rule has an `apply` function that:
 * - Takes the full sequence of toned syllables
 * - Returns a string explanation if the rule applies
 * - Returns null if the rule doesn't apply
 */

/**
 * Third Tone Sandhi: 3 + 3 → 2 + 3
 * When two third tones appear in sequence, the first becomes a second tone
 */
const thirdToneSandhi: ToneSandhiRule = {
  id: 'third-tone-sandhi',
  name: 'Third Tone Sandhi',
  description: 'When two 3rd tones appear together, pronounce the first as 2nd tone',
  enabled: true,
  apply: (sequence: TonedSyllable[]) => {
    // Find consecutive third tones
    for (let i = 0; i < sequence.length - 1; i++) {
      if (sequence[i].tone === 3 && sequence[i + 1].tone === 3) {
        const first = sequence[i].pinyinWithTone;
        const second = sequence[i + 1].pinyinWithTone;
        return `3–3 → 2–3 sandhi: ${first} ${second} → pronounce first syllable as 2nd tone`;
      }
    }
    return null;
  },
};

/**
 * 不 (bù) Tone Sandhi
 * 不 + 4th tone → 不 becomes 2nd tone (bú)
 * Note: This is a simplified version that applies to any bù + 4th tone pattern
 */
const buSandhi: ToneSandhiRule = {
  id: 'bu-sandhi',
  name: '不 (bù) Sandhi',
  description: 'When bù is followed by a 4th tone, pronounce it as 2nd tone (bú)',
  enabled: true,
  apply: (sequence: TonedSyllable[]) => {
    for (let i = 0; i < sequence.length - 1; i++) {
      if (sequence[i].syllable === 'bu' && sequence[i].tone === 4 && sequence[i + 1].tone === 4) {
        const bu = sequence[i].pinyinWithTone;
        const next = sequence[i + 1].pinyinWithTone;
        return `不 sandhi: ${bu} ${next} → pronounce 不 as 2nd tone (bú)`;
      }
    }
    return null;
  },
};

/**
 * 一 (yī) Tone Sandhi
 * 一 + 4th tone → 一 becomes 2nd tone (yí)
 * 一 + 1st/2nd/3rd tone → 一 becomes 4th tone (yì)
 */
const yiSandhi: ToneSandhiRule = {
  id: 'yi-sandhi',
  name: '一 (yī) Sandhi',
  description: 'When yī precedes 4th tone → yí (2nd); before 1st/2nd/3rd tone → yì (4th)',
  enabled: true,
  apply: (sequence: TonedSyllable[]) => {
    for (let i = 0; i < sequence.length - 1; i++) {
      if (sequence[i].syllable === 'yi' && sequence[i].tone === 1) {
        const yi = sequence[i].pinyinWithTone;
        const next = sequence[i + 1].pinyinWithTone;
        const nextTone = sequence[i + 1].tone;

        if (nextTone === 4) {
          return `一 sandhi: ${yi} ${next} → pronounce 一 as 2nd tone (yí)`;
        } else if (nextTone === 1 || nextTone === 2 || nextTone === 3) {
          return `一 sandhi: ${yi} ${next} → pronounce 一 as 4th tone (yì)`;
        }
      }
    }
    return null;
  },
};

/**
 * Neutral Tone Context
 * If a neutral tone (tone 5) appears, note that it's pronounced lightly/unstressed
 */
const neutralToneRule: ToneSandhiRule = {
  id: 'neutral-tone',
  name: 'Neutral Tone',
  description: 'Neutral tones (5) are pronounced lightly and unstressed',
  enabled: true,
  apply: (sequence: TonedSyllable[]) => {
    const hasNeutral = sequence.some(s => s.tone === 5);
    if (hasNeutral) {
      return 'Neutral tones present: pronounce lightly and unstressed';
    }
    return null;
  },
};

/**
 * Default rule set - all rules enabled by default
 */
export const DEFAULT_SANDHI_RULES: ToneSandhiRule[] = [
  thirdToneSandhi,
  buSandhi,
  yiSandhi,
  neutralToneRule,
];

/**
 * Apply enabled sandhi rules to a sequence
 * Returns the first applicable rule's explanation, or a default message
 */
export function applySandhiRules(
  sequence: TonedSyllable[],
  rules: ToneSandhiRule[]
): string {
  // Check each enabled rule
  for (const rule of rules) {
    if (rule.enabled) {
      const explanation = rule.apply(sequence);
      if (explanation) {
        return explanation;
      }
    }
  }

  // No sandhi applies
  return 'Pronounce tones as written.';
}
