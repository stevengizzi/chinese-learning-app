import type { VocabularyEntry } from './vocabulary';

export type ExerciseType = 'character-to-pinyin' | 'english-to-pinyin';
export type PlayMode = 'endless' | 'complete-all' | 'drill';

export interface Exercise {
  id: string;
  type: ExerciseType;
  prompt: string;             // What to show (character or meaning)
  correctPinyin: string;      // Correct tone-number pinyin
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
