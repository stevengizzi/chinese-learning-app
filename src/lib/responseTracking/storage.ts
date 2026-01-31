/**
 * Response Time Tracking Storage Layer
 *
 * Manages loading and saving response time data to/from JSON file and localStorage cache
 */

import type { ResponseDatabase, ResponseRecord, VocabularySpeedStats, PromptType, PromptTypeStats } from '../../types/responseTracking';
import type { ExerciseType } from '../../types/exercise';

const DB_URL = `${import.meta.env.BASE_URL}data/response-tracking.json`;
const CACHE_KEY = 'response-tracking-cache';
const MAX_RECORDS = 10000;  // Keep last 10,000 records (~1.5-2MB in localStorage)

/**
 * Generate unique vocabulary ID
 */
export function generateVocabularyId(character: string, pinyin: string, meaning: string): string {
  return `${character}:${pinyin}:${meaning}`;
}

/**
 * Remap a vocabulary ID across the response database.
 * Used when a user edits a meaning in-app so that practice/mastery data stays linked.
 * Returns a new database object with the remapped ID, or the same object if no changes needed.
 */
export function remapVocabularyId(
  db: ResponseDatabase,
  oldId: string,
  newId: string
): ResponseDatabase {
  if (oldId === newId) return db;

  let changed = false;

  // Remap statistics key
  let updatedStatistics = db.statistics;
  if (db.statistics[oldId]) {
    updatedStatistics = { ...db.statistics };
    updatedStatistics[newId] = {
      ...updatedStatistics[oldId],
      vocabularyId: newId,
      meaning: newId.split(':').slice(2).join(':'),
    };
    delete updatedStatistics[oldId];
    changed = true;
  }

  // Remap records
  let updatedRecords = db.records;
  if (db.records.some(r => r.vocabularyId === oldId)) {
    updatedRecords = db.records.map(r =>
      r.vocabularyId === oldId ? { ...r, vocabularyId: newId } : r
    );
    changed = true;
  }

  if (!changed) return db;

  return {
    ...db,
    records: updatedRecords,
    statistics: updatedStatistics,
    lastUpdated: Date.now()
  };
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
 * Migrate existing audio exercise records from character-based prompt types
 * to dedicated audio prompt types.
 * Records with exerciseType 'audio-to-pinyin'/'audio-to-english' were previously
 * stored with promptType 'character-to-pinyin'/'character-to-english'.
 */
function migrateAudioPromptTypes(database: ResponseDatabase): ResponseDatabase {
  let migrated = false;

  // Fix records: remap promptType for audio exercises
  // Note: old records used 'character-to-pinyin'/'character-to-english' which are now legacy values
  const updatedRecords = database.records.map(record => {
    if (record.exerciseType === 'audio-to-pinyin' && (record.promptType as string) === 'character-to-pinyin') {
      migrated = true;
      return { ...record, promptType: 'audio-to-pinyin' as PromptType };
    }
    if (record.exerciseType === 'audio-to-english' && (record.promptType as string) === 'character-to-english') {
      migrated = true;
      return { ...record, promptType: 'audio-to-english' as PromptType };
    }
    return record;
  });

  if (!migrated) return database;

  // Recompute statistics for affected vocabulary entries
  const updatedStatistics = { ...database.statistics };

  for (const vocabId of Object.keys(updatedStatistics)) {
    const stats = { ...updatedStatistics[vocabId] };

    // Ensure audio prompt type slots exist
    if (!stats.byPromptType['audio-to-pinyin']) {
      stats.byPromptType = { ...stats.byPromptType, 'audio-to-pinyin': createEmptyPromptTypeStats() };
    }
    if (!stats.byPromptType['audio-to-english']) {
      stats.byPromptType = { ...stats.byPromptType, 'audio-to-english': createEmptyPromptTypeStats() };
    }

    // Rebuild prompt type stats from records for this vocabulary
    const vocabRecords = updatedRecords.filter(r => r.vocabularyId === vocabId);

    // Reset audio and legacy character prompt stats, then recompute
    // Note: 'character-to-pinyin'/'character-to-english' are legacy keys from old data
    const affectedTypes: string[] = ['character-to-pinyin', 'character-to-english', 'audio-to-pinyin', 'audio-to-english'];
    for (const pt of affectedTypes) {
      (stats.byPromptType as Record<string, PromptTypeStats>)[pt] = createEmptyPromptTypeStats();
    }

    for (const record of vocabRecords) {
      if (!affectedTypes.includes(record.promptType as string)) continue;

      const promptStats = (stats.byPromptType as Record<string, PromptTypeStats>)[record.promptType as string];
      promptStats.totalAttempts++;
      promptStats.lastAttemptTimestamp = Math.max(promptStats.lastAttemptTimestamp, record.timestamp);

      if (record.wasCorrect) {
        promptStats.correctAttempts++;
        const perWordTimeMs = record.wordCount > 0 ? record.responseTimeMs / record.wordCount : record.responseTimeMs;
        promptStats.recentResponseTimes = [...promptStats.recentResponseTimes, perWordTimeMs].slice(-10);
        promptStats.fastestResponseMs = Math.min(promptStats.fastestResponseMs, perWordTimeMs);
        promptStats.slowestResponseMs = Math.max(promptStats.slowestResponseMs, perWordTimeMs);

        if (promptStats.recentResponseTimes.length > 0) {
          promptStats.averageResponseTimeMs = promptStats.recentResponseTimes.reduce((a, b) => a + b, 0) / promptStats.recentResponseTimes.length;
        }
      }
    }

    updatedStatistics[vocabId] = stats;
  }

  return {
    ...database,
    version: 2,
    records: updatedRecords,
    statistics: updatedStatistics,
    lastUpdated: Date.now()
  };
}

/**
 * Migrate character-to-pinyin/character-to-english prompt types
 * to simplified-to-pinyin/simplified-to-english.
 * All historical data was simplified, so existing records are remapped accordingly.
 */
function migrateCharacterSetPromptTypes(database: ResponseDatabase): ResponseDatabase {
  let migrated = false;

  const updatedRecords = database.records.map(record => {
    const pt = record.promptType as string;
    if (pt === 'character-to-pinyin') {
      migrated = true;
      return { ...record, promptType: 'simplified-to-pinyin' as PromptType };
    }
    if (pt === 'character-to-english') {
      migrated = true;
      return { ...record, promptType: 'simplified-to-english' as PromptType };
    }
    return record;
  });

  if (!migrated) return database;

  const updatedStatistics = { ...database.statistics };

  for (const vocabId of Object.keys(updatedStatistics)) {
    const stats = { ...updatedStatistics[vocabId] };
    const bp = stats.byPromptType as Record<string, PromptTypeStats>;

    // Move old keys to new keys
    if (bp['character-to-pinyin']) {
      bp['simplified-to-pinyin'] = bp['character-to-pinyin'];
      delete bp['character-to-pinyin'];
    }
    if (bp['character-to-english']) {
      bp['simplified-to-english'] = bp['character-to-english'];
      delete bp['character-to-english'];
    }

    // Ensure all 8 keys exist
    const allKeys: PromptType[] = [
      'simplified-to-pinyin', 'traditional-to-pinyin',
      'simplified-to-english', 'traditional-to-english',
      'pinyin-to-english', 'english-to-pinyin',
      'audio-to-pinyin', 'audio-to-english'
    ];
    for (const pt of allKeys) {
      if (!bp[pt]) bp[pt] = createEmptyPromptTypeStats();
    }

    stats.byPromptType = bp as Record<PromptType, PromptTypeStats>;
    updatedStatistics[vocabId] = stats;
  }

  return {
    ...database,
    version: 3,
    records: updatedRecords,
    statistics: updatedStatistics,
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
  let result: ResponseDatabase;
  if (fileData && cacheData) {
    // Both exist - use the one with the most recent data
    const useCache = cacheData.lastUpdated > fileData.lastUpdated;
    result = useCache ? cacheData : fileData;

    // Update localStorage with the most recent data
    if (!useCache) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(fileData));
    }
  } else if (cacheData) {
    result = cacheData;
  } else if (fileData) {
    localStorage.setItem(CACHE_KEY, JSON.stringify(fileData));
    result = fileData;
  } else {
    return createEmptyDatabase();
  }

  // Run migrations
  let migrated = migrateAudioPromptTypes(result);
  migrated = migrateCharacterSetPromptTypes(migrated);
  if (migrated !== result) {
    saveResponseDatabase(migrated);
  }
  return migrated;
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
    source?: 'exercise' | 'flashcard';
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
    timestamp: now,
    source: r.source,
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
          'simplified-to-pinyin': createEmptyPromptTypeStats(),
          'traditional-to-pinyin': createEmptyPromptTypeStats(),
          'simplified-to-english': createEmptyPromptTypeStats(),
          'traditional-to-english': createEmptyPromptTypeStats(),
          'pinyin-to-english': createEmptyPromptTypeStats(),
          'english-to-pinyin': createEmptyPromptTypeStats(),
          'audio-to-pinyin': createEmptyPromptTypeStats(),
          'audio-to-english': createEmptyPromptTypeStats()
        }
      };
    }

    // Ensure wordCount is set (for backward compatibility)
    if (!stats.wordCount) {
      stats.wordCount = wordCount;
    }

    // Ensure byPromptType exists and has all prompt types (for backward compatibility with old data)
    if (!stats.byPromptType) {
      stats.byPromptType = {
        'simplified-to-pinyin': createEmptyPromptTypeStats(),
        'traditional-to-pinyin': createEmptyPromptTypeStats(),
        'simplified-to-english': createEmptyPromptTypeStats(),
        'traditional-to-english': createEmptyPromptTypeStats(),
        'pinyin-to-english': createEmptyPromptTypeStats(),
        'english-to-pinyin': createEmptyPromptTypeStats(),
        'audio-to-pinyin': createEmptyPromptTypeStats(),
        'audio-to-english': createEmptyPromptTypeStats()
      };
    }
    // Ensure all 8 prompt type slots exist (backward compatibility)
    const allPromptTypes: PromptType[] = [
      'simplified-to-pinyin', 'traditional-to-pinyin',
      'simplified-to-english', 'traditional-to-english',
      'pinyin-to-english', 'english-to-pinyin',
      'audio-to-pinyin', 'audio-to-english'
    ];
    for (const pt of allPromptTypes) {
      if (!stats.byPromptType[pt]) {
        stats.byPromptType[pt] = createEmptyPromptTypeStats();
      }
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

/**
 * Filter a database to exclude records from a given source.
 * Returns a new database with filtered records; statistics are left untouched
 * (mastery calculations primarily use the rolling window from records).
 */
export function filterDatabaseBySource(
  db: ResponseDatabase,
  excludeSource: 'exercise' | 'flashcard'
): ResponseDatabase {
  return {
    ...db,
    records: db.records.filter(r => (r.source || 'exercise') !== excludeSource),
  };
}
