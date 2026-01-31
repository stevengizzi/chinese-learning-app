import type { VocabularyEntry } from './vocabulary';
import type { PromptType } from './responseTracking';
import type { VocabularyFilterConfig } from './vocabularyFilter';
import type { SpeechRate, ReplayLimit } from './tts';

export type ExerciseType =
  | 'character-to-pinyin'
  | 'english-to-pinyin'
  | 'shuffled'
  | 'audio-to-pinyin'
  | 'character-to-english'
  | 'pinyin-to-english'
  | 'shuffled-to-english'
  | 'audio-to-english'
  | 'flashcard';

/**
 * Check if an exercise type uses audio prompts
 */
export function isAudioExercise(type: ExerciseType): boolean {
  return type === 'audio-to-pinyin' || type === 'audio-to-english';
}

/**
 * Configuration for audio exercises
 */
export interface AudioExerciseSettings {
  speechRate: SpeechRate;
  replayLimit: ReplayLimit;
}

export type PlayMode = 'endless' | 'complete-all' | 'drill' | 'speed-drill';

export interface Exercise {
  id: string;
  type: ExerciseType;
  prompt: string;             // What to show (character, meaning, or pinyin)
  promptType: PromptType;     // What was shown to user (determined from prompt content)
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

/**
 * Session configuration including training mode options
 */
export interface SessionConfig {
  exerciseType: ExerciseType;
  playMode: PlayMode;
  focusOnWeaknesses: boolean;
  vocabularyFilter?: VocabularyFilterConfig;
  audioSettings?: AudioExerciseSettings;
}
