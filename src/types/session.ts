import type { ExerciseAttempt, ExerciseType, PlayMode, AudioExerciseSettings } from './exercise';
import type { PromptType } from './responseTracking';
import type { VocabularyFilterConfig } from './vocabularyFilter';
import type { VocabularyEntry } from './vocabulary';
import type { CharacterSet } from '../lib/characterConverter';

export interface Session {
  id: string;
  exerciseType: ExerciseType;
  playMode: PlayMode;
  startTime: number;
  endTime?: number;
  attempts: ExerciseAttempt[];
  statistics: SessionStatistics;
  remainingWords?: string[];  // For complete-all, drill, and speed-drill modes
  totalPrompts?: number;  // Total number of prompts at session start (for drill modes)
  accumulatedTimeMs?: number;  // Total active time (excluding feedback screens)
  lastResumeTime?: number;  // Timestamp when timer last resumed
  exerciseStartTime?: number;  // When current exercise was shown
  responseTimings: Array<{
    vocabularyId: string;
    character: string;
    pinyin: string;
    meaning: string;
    promptType: PromptType;  // What was shown to the user
    responseTimeMs: number;
    wordCount: number;  // Number of words in correct answer
    wasCorrect: boolean;
  }>;
  speedDrillConfig?: {
    baseThresholdMs: number;  // Base threshold (default 3000ms)
    incrementPerWordMs: number;  // Additional ms per word (default 1000ms)
  };
  focusOnWeaknesses?: boolean;  // Whether this session is using focus mode
  vocabularyFilter?: VocabularyFilterConfig;  // Filter used to select vocabulary for this session
  filteredVocabulary?: VocabularyEntry[];  // The filtered vocabulary entries used in this session
  audioSettings?: AudioExerciseSettings;  // Settings for audio exercises (speech rate, replay limit)
  characterSet?: CharacterSet;  // Which character set was used (simplified or traditional)
}

export interface SessionStatistics {
  totalExercises: number;
  totalCharacters: number;
  correctCharacters: number;
  averageAccuracy: number;
  toneErrors: number;
  syllableErrors: number;
  commonMistakes: Record<string, number>;
  totalTimeMs?: number;  // Total time spent in session
  averageTimePerCorrectAnswer?: number;  // Average time per correct answer in ms
}
