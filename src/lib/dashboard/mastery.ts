import type { VocabularyEntry } from '../../types/vocabulary';
import type { ResponseDatabase, VocabularySpeedStats } from '../../types/responseTracking';
import type {
  MasteryLevel,
  VocabularyMasteryInfo,
  MasteryBreakdown
} from '../../types/dashboard';
import { calculateGlobalAverage } from '../responseTracking/storage';

/**
 * Mastery thresholds
 */
const THRESHOLDS = {
  mastered: {
    accuracy: 90,
    minAttempts: 5,
    speedRatio: 0.8  // Must be <= 80% of global average (faster)
  },
  learning: {
    accuracy: 70,
    minAttempts: 3
  }
} as const;

/**
 * Calculate mastery level for a single vocabulary entry
 */
export function calculateMasteryLevel(
  stats: VocabularySpeedStats | null | undefined,
  globalAverageMs: number
): MasteryLevel {
  // No stats = new vocabulary
  if (!stats || stats.totalAttempts === 0) {
    return 'new';
  }

  const accuracy = (stats.correctAttempts / stats.totalAttempts) * 100;
  const speedRatio = globalAverageMs > 0
    ? stats.averageResponseTimeMs / globalAverageMs
    : 1;

  // Check for mastered: high accuracy, enough attempts, and fast
  if (
    accuracy >= THRESHOLDS.mastered.accuracy &&
    stats.totalAttempts >= THRESHOLDS.mastered.minAttempts &&
    speedRatio <= THRESHOLDS.mastered.speedRatio
  ) {
    return 'mastered';
  }

  // Check for learning: decent accuracy and some attempts
  if (
    accuracy >= THRESHOLDS.learning.accuracy &&
    stats.totalAttempts >= THRESHOLDS.learning.minAttempts
  ) {
    return 'learning';
  }

  // Has attempts but doesn't meet learning threshold = struggling
  return 'struggling';
}

/**
 * Generate vocabulary ID from entry
 */
function generateVocabularyId(entry: VocabularyEntry): string {
  return `${entry.word}:${entry.pinyin}:${entry.meaning}`;
}

/**
 * Get mastery information for a single vocabulary entry
 */
export function getVocabularyMasteryInfo(
  entry: VocabularyEntry,
  database: ResponseDatabase | null,
  globalAverageMs: number
): VocabularyMasteryInfo {
  const vocabularyId = generateVocabularyId(entry);
  const stats = database?.statistics?.[vocabularyId];

  const masteryLevel = calculateMasteryLevel(stats, globalAverageMs);

  return {
    vocabularyId,
    character: entry.word,
    pinyin: entry.pinyin,
    meaning: entry.meaning,
    masteryLevel,
    accuracy: stats && stats.totalAttempts > 0
      ? (stats.correctAttempts / stats.totalAttempts) * 100
      : 0,
    averageSpeedMs: stats?.averageResponseTimeMs || 0,
    totalAttempts: stats?.totalAttempts || 0,
    lastPracticed: stats?.lastAttemptTimestamp || null
  };
}

/**
 * Get complete mastery breakdown for all vocabulary
 */
export function getMasteryBreakdown(
  vocabulary: VocabularyEntry[],
  database: ResponseDatabase | null
): MasteryBreakdown {
  const globalAverageMs = database ? calculateGlobalAverage(database) : 2000;

  const breakdown: MasteryBreakdown = {
    mastered: [],
    learning: [],
    struggling: [],
    new: [],
    counts: {
      mastered: 0,
      learning: 0,
      struggling: 0,
      new: 0,
      total: vocabulary.length
    }
  };

  for (const entry of vocabulary) {
    const info = getVocabularyMasteryInfo(entry, database, globalAverageMs);
    breakdown[info.masteryLevel].push(info);
    breakdown.counts[info.masteryLevel]++;
  }

  // Sort each category by accuracy (descending) within the category
  breakdown.mastered.sort((a, b) => b.accuracy - a.accuracy);
  breakdown.learning.sort((a, b) => b.accuracy - a.accuracy);
  breakdown.struggling.sort((a, b) => b.accuracy - a.accuracy);
  // New items sorted by character
  breakdown.new.sort((a, b) => a.character.localeCompare(b.character));

  return breakdown;
}

/**
 * Get overall accuracy from all vocabulary stats
 */
export function getOverallAccuracy(database: ResponseDatabase | null): number {
  if (!database?.statistics) {
    return 0;
  }

  let totalAttempts = 0;
  let totalCorrect = 0;

  for (const stats of Object.values(database.statistics)) {
    totalAttempts += stats.totalAttempts;
    totalCorrect += stats.correctAttempts;
  }

  if (totalAttempts === 0) {
    return 0;
  }

  return (totalCorrect / totalAttempts) * 100;
}

/**
 * Get mastery progress as a percentage
 */
export function getMasteryProgress(breakdown: MasteryBreakdown): number {
  if (breakdown.counts.total === 0) {
    return 0;
  }

  // Weight: mastered = 100%, learning = 50%, struggling = 10%, new = 0%
  const weightedScore =
    breakdown.counts.mastered * 1.0 +
    breakdown.counts.learning * 0.5 +
    breakdown.counts.struggling * 0.1;

  return (weightedScore / breakdown.counts.total) * 100;
}

/**
 * Get vocabulary items that need attention (low accuracy or not practiced recently)
 */
export function getWeakVocabulary(
  vocabulary: VocabularyEntry[],
  database: ResponseDatabase | null,
  limit: number = 10
): VocabularyMasteryInfo[] {
  const globalAverageMs = database ? calculateGlobalAverage(database) : 2000;

  const itemsWithStats = vocabulary
    .map(entry => getVocabularyMasteryInfo(entry, database, globalAverageMs))
    .filter(info => info.totalAttempts > 0 && info.accuracy < 80) // Only items that have been practiced but are below 80%
    .sort((a, b) => a.accuracy - b.accuracy); // Sort by accuracy ascending (weakest first)

  return itemsWithStats.slice(0, limit);
}

/**
 * Get vocabulary items that are new (never practiced)
 */
export function getNewVocabulary(
  vocabulary: VocabularyEntry[],
  database: ResponseDatabase | null,
  limit: number = 10
): VocabularyMasteryInfo[] {
  const globalAverageMs = database ? calculateGlobalAverage(database) : 2000;

  const newItems = vocabulary
    .map(entry => getVocabularyMasteryInfo(entry, database, globalAverageMs))
    .filter(info => info.totalAttempts === 0);

  return newItems.slice(0, limit);
}

/**
 * Get vocabulary items that are stale (not practiced recently)
 */
export function getStaleVocabulary(
  vocabulary: VocabularyEntry[],
  database: ResponseDatabase | null,
  daysThreshold: number = 7,
  limit: number = 10
): VocabularyMasteryInfo[] {
  const globalAverageMs = database ? calculateGlobalAverage(database) : 2000;
  const thresholdMs = Date.now() - daysThreshold * 24 * 60 * 60 * 1000;

  const staleItems = vocabulary
    .map(entry => getVocabularyMasteryInfo(entry, database, globalAverageMs))
    .filter(info =>
      info.totalAttempts > 0 &&
      info.lastPracticed !== null &&
      info.lastPracticed < thresholdMs
    )
    .sort((a, b) => (a.lastPracticed || 0) - (b.lastPracticed || 0)); // Sort by last practiced ascending (oldest first)

  return staleItems.slice(0, limit);
}
