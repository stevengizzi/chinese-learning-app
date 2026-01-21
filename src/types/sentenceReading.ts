// Types for Sentence Reading exercise

export interface Sentence {
  id: string;
  hanzi: string;           // Chinese characters (e.g., "我今天打车回家。")
  pinyin: string;          // Tone-number pinyin (e.g., "wo3 jin1 tian1 da3 che1 hui2 jia1")
  translations: string[];  // Array of acceptable English translations
  difficulty: 1 | 2 | 3 | 4 | 5;  // Difficulty level
}

export interface SentenceReadingConfig {
  difficultyRange: [number, number];  // [min, max] 1-5
}

export interface SentenceAttempt {
  sentenceId: string;
  userPinyin: string;
  userTranslation: string;
  pinyinCorrect: boolean;
  meaningCorrect: boolean | null;  // null = self-graded, true/false = user's self-assessment
  timeMs: number;
}

export interface SentenceReadingSession {
  id: string;
  config: SentenceReadingConfig;
  startTime: number;
  endTime?: number;
  attempts: SentenceAttempt[];
  currentIndex: number;
  sentenceOrder: string[];  // IDs of sentences in order
}

export interface SentenceReadingState {
  config: SentenceReadingConfig | null;
  currentSession: SentenceReadingSession | null;
  currentSentence: Sentence | null;
  sentences: Sentence[];
  screen: 'setup' | 'exercise' | 'feedback' | 'report';
}
