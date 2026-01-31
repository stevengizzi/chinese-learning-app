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
  | 'simplified-to-pinyin'     // Simplified character → Pinyin
  | 'traditional-to-pinyin'    // Traditional character → Pinyin
  | 'simplified-to-english'    // Simplified character → English
  | 'traditional-to-english'   // Traditional character → English
  | 'pinyin-to-english'        // Pinyin → English
  | 'english-to-pinyin'        // English → Pinyin
  | 'audio-to-pinyin'          // Audio → Pinyin
  | 'audio-to-english';        // Audio → English

/**
 * Individual response record
 */
export interface ResponseRecord {
  vocabularyId: string;        // Unique ID: "{character}:{pinyin}:{meaning}"
  character: string;            // The Chinese character
  exerciseType: ExerciseType;  // Type of exercise
  promptType: PromptType;       // What was shown to user (for shuffled exercises)
  responseTimeMs: number;       // Time taken to respond (ms)
  wordCount: number;            // Number of words in correct answer
  wasCorrect: boolean;          // Whether answer was correct
  timestamp: number;            // When this occurred (Unix timestamp)
  source?: 'exercise' | 'flashcard';  // Origin of record (defaults to 'exercise' for backward compat)
}

/**
 * Statistics for a specific prompt type
 */
export interface PromptTypeStats {
  totalAttempts: number;
  correctAttempts: number;
  averageResponseTimeMs: number;  // Average per-word response time (correct responses only)
  fastestResponseMs: number;      // Fastest per-word response time
  slowestResponseMs: number;      // Slowest per-word response time
  lastAttemptTimestamp: number;
  recentResponseTimes: number[];  // Last 10 correct per-word response times
}

/**
 * Aggregated statistics for a vocabulary entry
 */
export interface VocabularySpeedStats {
  vocabularyId: string;
  character: string;
  pinyin: string;
  meaning: string;
  wordCount: number;              // Number of words in this vocabulary entry
  totalAttempts: number;
  correctAttempts: number;
  averageResponseTimeMs: number;  // Average per-word response time (correct responses, all prompt types)
  fastestResponseMs: number;      // Fastest per-word response time
  slowestResponseMs: number;      // Slowest per-word response time
  lastAttemptTimestamp: number;
  recentResponseTimes: number[];  // Last 10 correct per-word response times
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
