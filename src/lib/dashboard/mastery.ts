import type { VocabularyEntry } from '../../types/vocabulary';
import type { ResponseDatabase, VocabularySpeedStats, ResponseRecord, PromptType, PromptTypeStats } from '../../types/responseTracking';
import type {
  MasteryLevel,
  VocabularyMasteryInfo,
  MasteryBreakdown,
  PromptTypeMasteryInfo,
  AggregateMasteryData
} from '../../types/dashboard';
import { ALL_PROMPT_TYPES } from '../../types/dashboard';

/**
 * Mastery thresholds using rolling window
 */
const THRESHOLDS = {
  rollingWindow: 10,  // Number of recent attempts to consider
  mastered: {
    accuracyPercent: 80,  // Need 80% accuracy (12 out of 15)
    baseSpeedMs: 2500,    // Base threshold for 1-word answers
    speedPerWordMs: 750   // Additional ms per extra word
  },
  learning: {
    accuracyPercent: 60   // Need 60% accuracy
  }
} as const;

/**
 * Calculate speed threshold for a given word count
 * Base: 2500ms for 1 word, +750ms for each additional word
 */
function calculateSpeedThreshold(wordCount: number): number {
  return THRESHOLDS.mastered.baseSpeedMs + Math.max(0, wordCount - 1) * THRESHOLDS.mastered.speedPerWordMs;
}

/**
 * Get the last N attempts for a vocabulary item from the records
 */
function getRecentAttempts(
  records: ResponseRecord[],
  vocabularyId: string,
  limit: number
): ResponseRecord[] {
  // Filter records for this vocabulary item, most recent first
  const vocabRecords = records
    .filter(r => r.vocabularyId === vocabularyId)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);

  return vocabRecords;
}

/**
 * Calculate mastery level for a single vocabulary entry using rolling window
 */
export function calculateMasteryLevel(
  stats: VocabularySpeedStats | null | undefined,
  recentAttempts: ResponseRecord[]
): MasteryLevel {
  // No stats or no attempts = new vocabulary
  if (!stats || stats.totalAttempts === 0) {
    return 'new';
  }

  const totalRecent = recentAttempts.length;

  // Calculate accuracy - use rolling window if available, otherwise fall back to lifetime stats
  let accuracyPercent: number;
  if (totalRecent > 0) {
    const correctRecent = recentAttempts.filter(r => r.wasCorrect).length;
    accuracyPercent = (correctRecent / totalRecent) * 100;
  } else {
    // Records were trimmed - fall back to lifetime accuracy
    accuracyPercent = (stats.correctAttempts / stats.totalAttempts) * 100;
  }

  // Need a full rolling window to be considered for "mastered"
  if (totalRecent >= THRESHOLDS.rollingWindow) {
    // Calculate average response time from correct attempts in the window
    const correctAttempts = recentAttempts.filter(r => r.wasCorrect);

    if (correctAttempts.length > 0 && accuracyPercent >= THRESHOLDS.mastered.accuracyPercent) {
      const avgResponseTimeMs = correctAttempts.reduce((sum, r) => sum + r.responseTimeMs, 0) / correctAttempts.length;
      const wordCount = stats.wordCount || 1;
      const speedThreshold = calculateSpeedThreshold(wordCount);

      // Check for mastered: high accuracy AND fast enough
      if (avgResponseTimeMs <= speedThreshold) {
        return 'mastered';
      }
    }
  }

  // Check for learning: decent accuracy (no minimum attempts required)
  if (accuracyPercent >= THRESHOLDS.learning.accuracyPercent) {
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
 * Get recent attempts for a specific prompt type
 */
function getRecentAttemptsForPromptType(
  records: ResponseRecord[],
  vocabularyId: string,
  promptType: PromptType,
  limit: number
): ResponseRecord[] {
  return records
    .filter(r => r.vocabularyId === vocabularyId && r.promptType === promptType)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}

/**
 * Calculate mastery level for a specific prompt type
 */
export function calculatePromptTypeMasteryLevel(
  promptStats: PromptTypeStats | undefined,
  recentAttempts: ResponseRecord[],
  wordCount: number
): MasteryLevel {
  // No stats or no attempts = new
  if (!promptStats || promptStats.totalAttempts === 0) {
    return 'new';
  }

  const totalRecent = recentAttempts.length;

  // Calculate accuracy
  let accuracyPercent: number;
  if (totalRecent > 0) {
    const correctRecent = recentAttempts.filter(r => r.wasCorrect).length;
    accuracyPercent = (correctRecent / totalRecent) * 100;
  } else {
    // Fall back to lifetime accuracy
    accuracyPercent = (promptStats.correctAttempts / promptStats.totalAttempts) * 100;
  }

  // Need full rolling window to be considered for "mastered"
  if (totalRecent >= THRESHOLDS.rollingWindow) {
    const correctAttempts = recentAttempts.filter(r => r.wasCorrect);

    if (correctAttempts.length > 0 && accuracyPercent >= THRESHOLDS.mastered.accuracyPercent) {
      const avgResponseTimeMs = correctAttempts.reduce((sum, r) => sum + r.responseTimeMs, 0) / correctAttempts.length;
      const speedThreshold = calculateSpeedThreshold(wordCount);

      if (avgResponseTimeMs <= speedThreshold) {
        return 'mastered';
      }
    }
  }

  // Check for learning
  if (accuracyPercent >= THRESHOLDS.learning.accuracyPercent) {
    return 'learning';
  }

  return 'struggling';
}

/**
 * Get mastery info for all prompt types
 */
function getPromptTypeMasteryInfos(
  stats: VocabularySpeedStats | null | undefined,
  records: ResponseRecord[],
  vocabularyId: string
): Record<PromptType, PromptTypeMasteryInfo> {
  const result = {} as Record<PromptType, PromptTypeMasteryInfo>;
  const wordCount = stats?.wordCount || 1;

  for (const promptType of ALL_PROMPT_TYPES) {
    const promptStats = stats?.byPromptType?.[promptType];
    const recentAttempts = getRecentAttemptsForPromptType(
      records,
      vocabularyId,
      promptType,
      THRESHOLDS.rollingWindow
    );

    const masteryLevel = calculatePromptTypeMasteryLevel(promptStats, recentAttempts, wordCount);

    // Calculate display accuracy
    let accuracy = 0;
    if (recentAttempts.length > 0) {
      const correctRecent = recentAttempts.filter(r => r.wasCorrect).length;
      accuracy = (correctRecent / recentAttempts.length) * 100;
    } else if (promptStats && promptStats.totalAttempts > 0) {
      accuracy = (promptStats.correctAttempts / promptStats.totalAttempts) * 100;
    }

    // Calculate display speed
    let averageSpeedMs = 0;
    const correctRecentAttempts = recentAttempts.filter(r => r.wasCorrect);
    if (correctRecentAttempts.length > 0) {
      averageSpeedMs = correctRecentAttempts.reduce((sum, r) => sum + r.responseTimeMs, 0) / correctRecentAttempts.length;
    } else if (promptStats?.averageResponseTimeMs) {
      averageSpeedMs = promptStats.averageResponseTimeMs;
    }

    result[promptType] = {
      promptType,
      masteryLevel,
      accuracy,
      averageSpeedMs,
      totalAttempts: promptStats?.totalAttempts || 0,
      lastPracticed: promptStats?.lastAttemptTimestamp || null
    };
  }

  return result;
}

/**
 * Get mastery information for a single vocabulary entry
 */
export function getVocabularyMasteryInfo(
  entry: VocabularyEntry,
  database: ResponseDatabase | null
): VocabularyMasteryInfo {
  const vocabularyId = generateVocabularyId(entry);
  const stats = database?.statistics?.[vocabularyId];
  const records = database?.records || [];

  // Get recent attempts for rolling window calculation
  const recentAttempts = getRecentAttempts(records, vocabularyId, THRESHOLDS.rollingWindow);

  // Get per-prompt-type mastery info
  const byPromptType = getPromptTypeMasteryInfos(stats, records, vocabularyId);

  // Count how many prompt types are mastered
  const promptTypesMastered = ALL_PROMPT_TYPES.filter(
    pt => byPromptType[pt].masteryLevel === 'mastered'
  ).length;

  // Determine overall mastery level based on prompt type completion
  // "new" = no prompt types attempted
  // "mastered" = all prompt types mastered
  // "learning" = at least one mastered or learning, none struggling
  // "struggling" = any prompt type struggling
  const promptTypesAttempted = ALL_PROMPT_TYPES.filter(
    pt => byPromptType[pt].totalAttempts > 0
  ).length;

  let masteryLevel: MasteryLevel;
  if (promptTypesAttempted === 0) {
    masteryLevel = 'new';
  } else if (promptTypesMastered === ALL_PROMPT_TYPES.length) {
    masteryLevel = 'mastered';
  } else {
    // Check if any are struggling
    const anyStruggling = ALL_PROMPT_TYPES.some(
      pt => byPromptType[pt].masteryLevel === 'struggling'
    );
    if (anyStruggling) {
      masteryLevel = 'struggling';
    } else {
      masteryLevel = 'learning';
    }
  }

  // Calculate rolling window accuracy for display (if we have recent attempts)
  let displayAccuracy = 0;
  if (recentAttempts.length > 0) {
    const correctRecent = recentAttempts.filter(r => r.wasCorrect).length;
    displayAccuracy = (correctRecent / recentAttempts.length) * 100;
  } else if (stats && stats.totalAttempts > 0) {
    // Fall back to lifetime accuracy if no recent records
    displayAccuracy = (stats.correctAttempts / stats.totalAttempts) * 100;
  }

  // Calculate rolling window average speed for display (from correct attempts)
  let displaySpeedMs = 0;
  const correctRecentAttempts = recentAttempts.filter(r => r.wasCorrect);
  if (correctRecentAttempts.length > 0) {
    displaySpeedMs = correctRecentAttempts.reduce((sum, r) => sum + r.responseTimeMs, 0) / correctRecentAttempts.length;
  } else if (stats?.averageResponseTimeMs) {
    displaySpeedMs = stats.averageResponseTimeMs;
  }

  return {
    vocabularyId,
    character: entry.word,
    pinyin: entry.pinyin,
    meaning: entry.meaning,
    masteryLevel,
    accuracy: displayAccuracy,
    averageSpeedMs: displaySpeedMs,
    totalAttempts: stats?.totalAttempts || 0,
    lastPracticed: stats?.lastAttemptTimestamp || null,
    byPromptType,
    promptTypesMastered
  };
}

/**
 * Get complete mastery breakdown for all vocabulary
 */
export function getMasteryBreakdown(
  vocabulary: VocabularyEntry[],
  database: ResponseDatabase | null
): MasteryBreakdown {
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
    const info = getVocabularyMasteryInfo(entry, database);
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
  const itemsWithStats = vocabulary
    .map(entry => getVocabularyMasteryInfo(entry, database))
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
  const newItems = vocabulary
    .map(entry => getVocabularyMasteryInfo(entry, database))
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
  const thresholdMs = Date.now() - daysThreshold * 24 * 60 * 60 * 1000;

  const staleItems = vocabulary
    .map(entry => getVocabularyMasteryInfo(entry, database))
    .filter(info =>
      info.totalAttempts > 0 &&
      info.lastPracticed !== null &&
      info.lastPracticed < thresholdMs
    )
    .sort((a, b) => (a.lastPracticed || 0) - (b.lastPracticed || 0)); // Sort by last practiced ascending (oldest first)

  return staleItems.slice(0, limit);
}

/**
 * Get aggregate mastery data for radar chart visualization
 * Returns mastery percentage for each prompt type across all vocabulary
 */
export function getAggregateMasteryData(
  vocabulary: VocabularyEntry[],
  database: ResponseDatabase | null
): AggregateMasteryData {
  // Initialize counters for each prompt type
  const byPromptType = {} as AggregateMasteryData['byPromptType'];
  for (const pt of ALL_PROMPT_TYPES) {
    byPromptType[pt] = {
      totalVocabulary: vocabulary.length,
      mastered: 0,
      learning: 0,
      struggling: 0,
      new: 0,
      masteryPercentage: 0
    };
  }

  // Count mastery levels for each prompt type across all vocabulary
  for (const entry of vocabulary) {
    const info = getVocabularyMasteryInfo(entry, database);
    for (const pt of ALL_PROMPT_TYPES) {
      const level = info.byPromptType[pt].masteryLevel;
      byPromptType[pt][level]++;
    }
  }

  // Calculate mastery percentage for each prompt type
  // Weight: mastered = 100%, learning = 50%, struggling = 10%, new = 0%
  for (const pt of ALL_PROMPT_TYPES) {
    const data = byPromptType[pt];
    if (data.totalVocabulary > 0) {
      const weightedScore =
        data.mastered * 1.0 +
        data.learning * 0.5 +
        data.struggling * 0.1;
      data.masteryPercentage = (weightedScore / data.totalVocabulary) * 100;
    }
  }

  // Calculate overall mastery percentage (average across all prompt types)
  const overallMasteryPercentage =
    ALL_PROMPT_TYPES.reduce((sum, pt) => sum + byPromptType[pt].masteryPercentage, 0) / ALL_PROMPT_TYPES.length;

  return {
    byPromptType,
    overallMasteryPercentage
  };
}
