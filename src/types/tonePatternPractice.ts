/**
 * Types for the Tone Pattern Practice exercise.
 */

// Each slot can have multiple tones selected, or 'any' (all tones)
export type ToneSlotSelection = Set<1 | 2 | 3 | 4 | 5> | 'any';

export interface TonePatternConfig {
  pattern: ToneSlotSelection[];  // e.g., [Set([2]), 'any', Set([3,4])] for "2-any-(3 or 4)"
  displayMode: 'hanzi' | 'pinyin' | 'both';
  shuffle: boolean;
}

export interface TonePatternItem {
  id: string;
  source: 'vocabulary' | 'hsk' | 'sentences';
  hanzi: string;
  pinyin: string;           // Original pinyin (tone numbers)
  pinyinWithMarks: string;  // Converted to tone marks
  meaning?: string;
  pronouncedTones: number[]; // Tones after sandhi
  originalTones: number[];   // Written tones
  sandhiApplied: boolean;
}

export interface TonePatternSession {
  config: TonePatternConfig;
  items: TonePatternItem[];
  currentIndex: number;
  startTime: number;
}
