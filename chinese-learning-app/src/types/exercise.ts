import type { VocabularyEntry } from './vocabulary';

export interface Exercise {
  id: string;
  sentence: string;           // Chinese characters
  correctPinyin: string;      // Correct tone-number pinyin
  words: VocabularyEntry[];   // Words used in sentence
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
