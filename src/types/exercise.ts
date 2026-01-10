import type { VocabularyEntry } from './vocabulary';

export type ExerciseType =
  | 'character-to-pinyin'
  | 'english-to-pinyin'
  | 'shuffled'
  | 'character-to-english'
  | 'pinyin-to-english'
  | 'shuffled-to-english';

export type PlayMode = 'endless' | 'complete-all' | 'drill' | 'speed-drill';

export interface Exercise {
  id: string;
  type: ExerciseType;
  prompt: string;             // What to show (character, meaning, or pinyin)
  correctPinyin?: string;     // Correct tone-number pinyin (for pinyin exercises)
  correctMeaning?: string;    // Correct English meaning (for English exercises)
  words: VocabularyEntry[];   // Words used in exercise
}

export interface ErrorDetail {
  characterIndex: number;
  character: string;
  expectedPinyin: string;
  userPinyin: string;
  errorType: 'tone' | 'syllable' | 'missing' | 'extra';
}

export interface ExerciseAttempt {
  exerciseId: string;
  userAnswer: string;
  correctAnswer: string;
  score: {
    correct: number;
    total: number;
  };
  errors: ErrorDetail[];
  timestamp: number;
}
