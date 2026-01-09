// Types for Tone Sequence Trainer exercise

export type ToneNumber = 1 | 2 | 3 | 4 | 5; // 5 = neutral tone

export interface Tone {
  number: ToneNumber;
  name: string;
  symbol: string; // e.g., "ˉ", "ˊ", "ˇ", "ˋ", ""
  description: string;
}

export interface Syllable {
  pinyin: string; // Base syllable without tone (e.g., "ma", "zhang")
  difficulty: 1 | 2 | 3 | 4 | 5;
}

export interface ToneSandhiRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  // Pattern matching function - returns explanation if rule applies
  apply: (sequence: TonedSyllable[]) => string | null;
}

export interface TonedSyllable {
  syllable: string; // Base syllable
  tone: ToneNumber;
  pinyinWithTone: string; // e.g., "mā", "zhāng"
}

export interface ToneSequenceConfig {
  // Tone selection
  activeTones: Set<ToneNumber>;

  // Syllable filtering
  difficultyRange: [number, number]; // [min, max] 1-5
  excludedSyllables: Set<string>;

  // Sandhi rules
  sandhiRules: ToneSandhiRule[];

  // Exercise parameters
  sequenceLength: number;
  bpm: number;
}

export interface GeneratedSequence {
  syllables: TonedSyllable[];
  sandhiExplanation: string; // One-line explanation
}

export interface ToneSequenceSession {
  id: string;
  config: ToneSequenceConfig;
  startTime: number;
  endTime?: number;
  sequencesCompleted: number;
}

export interface ToneSequenceState {
  config: ToneSequenceConfig | null;
  currentSession: ToneSequenceSession | null;
  currentSequence: GeneratedSequence | null;
  screen: 'setup' | 'exercise' | 'report';
}
