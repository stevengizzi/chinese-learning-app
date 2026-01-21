import type { ExerciseAttempt, ExerciseType, PlayMode } from './exercise';
import type { PromptType } from './responseTracking';

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
