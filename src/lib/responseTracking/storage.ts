/**
 * Response Time Tracking Storage Layer
 *
 * Manages loading and saving response time data to/from JSON file and localStorage cache
 */

import type { ResponseDatabase, ResponseRecord, VocabularySpeedStats } from '../../types/responseTracking';
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
  try {
    // Try loading from file first
    const response = await fetch(DB_URL);
    if (response.ok) {
      const data = await response.json();
      // Cache in localStorage
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      return data;
    }
  } catch (error) {
    console.warn('Could not load response database from file, using cache or creating new:', error);
  }

  // Fallback to localStorage cache
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.warn('Could not load from cache:', error);
  }

  // Create new empty database
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
    responseTimeMs: number;
    wasCorrect: boolean;
  }>
): ResponseDatabase {
  const now = Date.now();

  // Add new records
  const newRecords: ResponseRecord[] = records.map(r => ({
    vocabularyId: r.vocabularyId,
    character: r.character,
    exerciseType: r.exerciseType,
    responseTimeMs: r.responseTimeMs,
    wasCorrect: r.wasCorrect,
    timestamp: now
  }));

  // Append and trim to MAX_RECORDS
  const allRecords = [...database.records, ...newRecords];
  const trimmedRecords = allRecords.slice(-MAX_RECORDS);

  // Update statistics for each vocabulary entry
  const updatedStatistics = { ...database.statistics };

  for (const record of records) {
    const { vocabularyId, character, pinyin, meaning, responseTimeMs, wasCorrect } = record;

    // Get or create stats entry
    let stats = updatedStatistics[vocabularyId];
    if (!stats) {
      stats = {
        vocabularyId,
        character,
        pinyin,
        meaning,
        totalAttempts: 0,
        correctAttempts: 0,
        averageResponseTimeMs: 0,
        fastestResponseMs: Infinity,
        slowestResponseMs: 0,
        lastAttemptTimestamp: 0,
        recentResponseTimes: []
      };
    }

    // Update stats
    stats.totalAttempts++;
    stats.lastAttemptTimestamp = now;

    if (wasCorrect) {
      stats.correctAttempts++;

      // Update response times (only for correct answers)
      stats.recentResponseTimes = [...stats.recentResponseTimes, responseTimeMs].slice(-10);
      stats.fastestResponseMs = Math.min(stats.fastestResponseMs, responseTimeMs);
      stats.slowestResponseMs = Math.max(stats.slowestResponseMs, responseTimeMs);

      // Recalculate average from recent times
      if (stats.recentResponseTimes.length > 0) {
        stats.averageResponseTimeMs = stats.recentResponseTimes.reduce((a, b) => a + b, 0) / stats.recentResponseTimes.length;
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
