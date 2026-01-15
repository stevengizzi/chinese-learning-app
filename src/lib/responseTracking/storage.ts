/**
 * Response Time Tracking Storage Layer
 *
 * Manages loading and saving response time data to/from JSON file and localStorage cache
 */

import type { ResponseDatabase, ResponseRecord, VocabularySpeedStats, PromptType, PromptTypeStats } from '../../types/responseTracking';
import type { ExerciseType } from '../../types/exercise';

const DB_URL = `${import.meta.env.BASE_URL}data/response-tracking.json`;
const CACHE_KEY = 'response-tracking-cache';
const MAX_RECORDS = 1000;  // Keep last 1000 records

/**
 * Generate unique vocabulary ID
 */
export function generateVocabularyId(character: string, pinyin: string, meaning: string): string {
  return `${character}:${pinyin}:${meaning}`;
}

/**
 * Count words in a text (handles both English and pinyin)
 * For pinyin: counts space-separated syllables
 * For English: counts space-separated words
 */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  // Split by whitespace and count non-empty parts
  return trimmed.split(/\s+/).length;
}

/**
 * Calculate speed threshold for a given word count
 * Base: 3000ms for 1 word, +1000ms for each additional word
 */
export function calculateSpeedThreshold(wordCount: number): number {
  return 3000 + Math.max(0, wordCount - 1) * 1000;
}

/**
 * Get entries that need speed drill training
 * Returns entries that either:
 * 1. Have no recorded correct attempts, OR
 * 2. Have average per-word time above the threshold for their word count
 */
export function getEntriesNeedingSpeedTraining(
  database: ResponseDatabase,
  vocabularyIds: string[]
): string[] {
  const needsTraining: string[] = [];

  for (const vocabId of vocabularyIds) {
    const stats = database.statistics[vocabId];

    if (!stats || stats.correctAttempts === 0) {
      // No data - needs training
      needsTraining.push(vocabId);
    } else {
      // Has data - check if above threshold
      const perWordThreshold = calculateSpeedThreshold(stats.wordCount) / stats.wordCount;
      if (stats.averageResponseTimeMs > perWordThreshold) {
        needsTraining.push(vocabId);
      }
    }
  }

  return needsTraining;
}

/**
 * Create empty database
 */
function createEmptyDatabase(): ResponseDatabase {
  return {
    version: 1,
    records: [],
    statistics: {},
    lastUpdated: Date.now()
  };
}

/**
 * Load database from file with localStorage cache fallback
 */
export async function loadResponseDatabase(): Promise<ResponseDatabase> {
  let fileData: ResponseDatabase | null = null;
  let cacheData: ResponseDatabase | null = null;

  // Try loading from file
  try {
    const response = await fetch(DB_URL);
    if (response.ok) {
      fileData = await response.json();
    }
  } catch (error) {
    console.warn('Could not load response database from file:', error);
  }

  // Try loading from localStorage cache
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      cacheData = JSON.parse(cached);
    }
  } catch (error) {
    console.warn('Could not load from cache:', error);
  }

  // Use the most recently updated database
  if (fileData && cacheData) {
    // Both exist - use the one with the most recent data
    const useCache = cacheData.lastUpdated > fileData.lastUpdated;
    const result = useCache ? cacheData : fileData;

    // Update localStorage with the most recent data
    if (!useCache) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(fileData));
    }

    return result;
  } else if (cacheData) {
    // Only cache exists
    return cacheData;
  } else if (fileData) {
    // Only file exists
    localStorage.setItem(CACHE_KEY, JSON.stringify(fileData));
    return fileData;
  }

  // Neither exists - create new empty database
  return createEmptyDatabase();
}

/**
 * Save database to localStorage cache
 * Note: File writes require manual git commit/push
 */
export function saveResponseDatabase(database: ResponseDatabase): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(database));
  } catch (error) {
    console.error('Failed to save response database to cache:', error);
  }
}

/**
 * Create empty prompt type stats
 */
function createEmptyPromptTypeStats(): PromptTypeStats {
  return {
    totalAttempts: 0,
    correctAttempts: 0,
    averageResponseTimeMs: 0,
    fastestResponseMs: Infinity,
    slowestResponseMs: 0,
    lastAttemptTimestamp: 0,
    recentResponseTimes: []
  };
}

/**
 * Add response records and update statistics
 */
export function addResponseRecords(
  database: ResponseDatabase,
  records: Array<{
    vocabularyId: string;
    character: string;
    pinyin: string;
    meaning: string;
    exerciseType: ExerciseType;
    promptType: PromptType;
    responseTimeMs: number;
    wordCount: number;
    wasCorrect: boolean;
  }>
): ResponseDatabase {
  const now = Date.now();

  // Add new records
  const newRecords: ResponseRecord[] = records.map(r => ({
    vocabularyId: r.vocabularyId,
    character: r.character,
    exerciseType: r.exerciseType,
    promptType: r.promptType,
    responseTimeMs: r.responseTimeMs,
    wordCount: r.wordCount,
    wasCorrect: r.wasCorrect,
    timestamp: now
  }));

  // Append and trim to MAX_RECORDS
  const allRecords = [...database.records, ...newRecords];
  const trimmedRecords = allRecords.slice(-MAX_RECORDS);

  // Update statistics for each vocabulary entry
  const updatedStatistics = { ...database.statistics };

  for (const record of records) {
    const { vocabularyId, character, pinyin, meaning, promptType, responseTimeMs, wordCount, wasCorrect } = record;

    // Calculate per-word response time
    const perWordTimeMs = wordCount > 0 ? responseTimeMs / wordCount : responseTimeMs;

    // Get or create stats entry
    let stats = updatedStatistics[vocabularyId];
    if (!stats) {
      stats = {
        vocabularyId,
        character,
        pinyin,
        meaning,
        wordCount,
        totalAttempts: 0,
        correctAttempts: 0,
        averageResponseTimeMs: 0,
        fastestResponseMs: Infinity,
        slowestResponseMs: 0,
        lastAttemptTimestamp: 0,
        recentResponseTimes: [],
        byPromptType: {
          'character-to-pinyin': createEmptyPromptTypeStats(),
          'character-to-english': createEmptyPromptTypeStats(),
          'pinyin-to-english': createEmptyPromptTypeStats(),
          'english-to-pinyin': createEmptyPromptTypeStats()
        }
      };
    }

    // Ensure wordCount is set (for backward compatibility)
    if (!stats.wordCount) {
      stats.wordCount = wordCount;
    }

    // Ensure byPromptType exists (for backward compatibility with old data)
    if (!stats.byPromptType) {
      stats.byPromptType = {
        'character-to-pinyin': createEmptyPromptTypeStats(),
        'character-to-english': createEmptyPromptTypeStats(),
        'pinyin-to-english': createEmptyPromptTypeStats(),
        'english-to-pinyin': createEmptyPromptTypeStats()
      };
    }

    // Update overall stats
    stats.totalAttempts++;
    stats.lastAttemptTimestamp = now;

    // Update prompt-type-specific stats
    const promptStats = stats.byPromptType[promptType];
    promptStats.totalAttempts++;
    promptStats.lastAttemptTimestamp = now;

    if (wasCorrect) {
      stats.correctAttempts++;
      promptStats.correctAttempts++;

      // Update overall response times with per-word time (only for correct answers)
      stats.recentResponseTimes = [...stats.recentResponseTimes, perWordTimeMs].slice(-10);
      stats.fastestResponseMs = Math.min(stats.fastestResponseMs, perWordTimeMs);
      stats.slowestResponseMs = Math.max(stats.slowestResponseMs, perWordTimeMs);

      // Update prompt-type-specific response times with per-word time
      promptStats.recentResponseTimes = [...promptStats.recentResponseTimes, perWordTimeMs].slice(-10);
      promptStats.fastestResponseMs = Math.min(promptStats.fastestResponseMs, perWordTimeMs);
      promptStats.slowestResponseMs = Math.max(promptStats.slowestResponseMs, perWordTimeMs);

      // Recalculate overall average from recent times
      if (stats.recentResponseTimes.length > 0) {
        stats.averageResponseTimeMs = stats.recentResponseTimes.reduce((a, b) => a + b, 0) / stats.recentResponseTimes.length;
      }

      // Recalculate prompt-type-specific average
      if (promptStats.recentResponseTimes.length > 0) {
        promptStats.averageResponseTimeMs = promptStats.recentResponseTimes.reduce((a, b) => a + b, 0) / promptStats.recentResponseTimes.length;
      }
    }

    updatedStatistics[vocabularyId] = stats;
  }

  return {
    ...database,
    records: trimmedRecords,
    statistics: updatedStatistics,
    lastUpdated: now
  };
}

/**
 * Get statistics for a specific vocabulary entry
 */
export function getVocabularyStats(
  database: ResponseDatabase,
  vocabularyId: string
): VocabularySpeedStats | null {
  return database.statistics[vocabularyId] || null;
}

/**
 * Calculate global average response time (correct answers only)
 */
export function calculateGlobalAverage(database: ResponseDatabase): number {
  const allStats = Object.values(database.statistics);
  const validStats = allStats.filter(s => s.correctAttempts > 0 && s.averageResponseTimeMs > 0);

  if (validStats.length === 0) {
    return 2000; // Default 2 seconds if no data
  }

  const total = validStats.reduce((sum, s) => sum + s.averageResponseTimeMs, 0);
  return total / validStats.length;
}

/**
 * Check if database has unsaved changes
 */
export function hasUnsavedChanges(database: ResponseDatabase): boolean {
  const cachedData = localStorage.getItem(CACHE_KEY);
  if (!cachedData) return false;

  try {
    const cached: ResponseDatabase = JSON.parse(cachedData);
    return cached.lastUpdated > database.lastUpdated;
  } catch {
    return false;
  }
}

/**
 * Export database as JSON string for manual file save
 */
export function exportDatabaseJSON(database: ResponseDatabase): string {
  return JSON.stringify(database, null, 2);
}
