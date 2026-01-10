/**
 * Response Time Tracking Types
 *
 * Tracks response times for vocabulary entries to enable speed training
 */

import type { ExerciseType } from './exercise';

/**
 * Prompt type - what was shown to the user
 */
export type PromptType =
  | 'character-to-pinyin'      // Character → Pinyin
  | 'character-to-english'     // Character → English
  | 'pinyin-to-english'        // Pinyin → English
  | 'english-to-pinyin';       // English → Pinyin

/**
 * Individual response record
 */
export interface ResponseRecord {
  vocabularyId: string;        // Unique ID: "{character}:{pinyin}:{meaning}"
  character: string;            // The Chinese character
  exerciseType: ExerciseType;  // Type of exercise
  promptType: PromptType;       // What was shown to user (for shuffled exercises)
  responseTimeMs: number;       // Time taken to respond (ms)
  wasCorrect: boolean;          // Whether answer was correct
  timestamp: number;            // When this occurred (Unix timestamp)
}

/**
 * Statistics for a specific prompt type
 */
export interface PromptTypeStats {
  totalAttempts: number;
  correctAttempts: number;
  averageResponseTimeMs: number;  // Average of correct responses only
  fastestResponseMs: number;
  slowestResponseMs: number;
  lastAttemptTimestamp: number;
  recentResponseTimes: number[];  // Last 10 correct response times
}

/**
 * Aggregated statistics for a vocabulary entry
 */
export interface VocabularySpeedStats {
  vocabularyId: string;
  character: string;
  pinyin: string;
  meaning: string;
  totalAttempts: number;
  correctAttempts: number;
  averageResponseTimeMs: number;  // Average of correct responses only (across all prompt types)
  fastestResponseMs: number;
  slowestResponseMs: number;
  lastAttemptTimestamp: number;
  recentResponseTimes: number[];  // Last 10 correct response times
  byPromptType: Record<PromptType, PromptTypeStats>;  // Stats broken down by prompt type
}

/**
 * Response time database structure
 */
export interface ResponseDatabase {
  version: number;              // Schema version for migrations
  records: ResponseRecord[];    // Raw records (rolling window of last 1000)
  statistics: Record<string, VocabularySpeedStats>;  // Aggregated stats by vocabularyId
  lastUpdated: number;          // Last update timestamp
}

/**
 * Speed performance level for feedback
 */
export type SpeedPerformance = 'excellent' | 'good' | 'average' | 'slow' | 'very-slow';

/**
 * Speed training report data
 */
export interface SpeedReport {
  sessionAverageMs: number;
  globalAverageMs: number;
  fastestResponseMs: number;
  slowestResponseMs: number;
  improvement: number;          // Percentage improvement vs historical average
  entriesPracticed: number;
  fastestEntries: Array<{
    character: string;
    timeMs: number;
  }>;
  slowestEntries: Array<{
    character: string;
    timeMs: number;
  }>;
}
