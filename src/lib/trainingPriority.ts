/**
 * Training Priority System
 *
 * Calculates priority scores for vocabulary items to enable "Focus on Weaknesses" mode.
 * Higher score = needs more training.
 *
 * Factors and weights:
 * - Accuracy (40%): Low accuracy = high priority
 * - Speed (30%): Slow response = high priority
 * - Recency (20%): Longer since last attempt = higher priority
 * - Novelty (10%): Fewer attempts = higher priority
 */

import type { VocabularyEntry } from '../types/vocabulary';
import type { PromptType, VocabularySpeedStats, ResponseDatabase, PromptTypeStats } from '../types/responseTracking';
import { generateVocabularyId, calculateSpeedThreshold } from './responseTracking/storage';

/**
 * Weights for each priority factor
 */
const WEIGHTS = {
  accuracy: 0.4,
  speed: 0.3,
  recency: 0.2,
  novelty: 0.1,
} as const;

/**
 * Thresholds and caps
 */
const RECENCY_CAP_DAYS = 30;  // Max days for recency score
const NOVELTY_CAP_ATTEMPTS = 20;  // After this many attempts, novelty factor is 0
const PRIORITY_THRESHOLD = 40;  // Items above this score "need work"

/**
 * Training priority score for a vocabulary item
 */
export interface TrainingPriorityScore {
  vocabularyId: string;
  totalScore: number;
  factors: {
    accuracy: number;
    speed: number;
    recency: number;
    novelty: number;
  };
}

/**
 * Get stats for a specific prompt type, with fallback to aggregate stats
 */
function getPromptTypeStats(
  stats: VocabularySpeedStats,
  promptType: PromptType
): PromptTypeStats | VocabularySpeedStats {
  const typeStats = stats.byPromptType?.[promptType];

  // Use prompt-type-specific stats if they have data
  if (typeStats && typeStats.totalAttempts > 0) {
    return typeStats;
  }

  // Fall back to aggregate stats
  return stats;
}

/**
 * Calculate priority score for a single vocabulary item
 */
export function calculateTrainingPriority(
  vocabularyId: string,
  promptType: PromptType,
  stats: VocabularySpeedStats | undefined,
  wordCount: number
): TrainingPriorityScore {
  // Default scores for items with no data
  if (!stats) {
    return {
      vocabularyId,
      totalScore: 55, // Middle-high priority (novelty kicks in)
      factors: {
        accuracy: 50, // Unknown = middle
        speed: 50,    // Unknown = middle
        recency: 100, // Never attempted = max
        novelty: 100, // No attempts = max
      },
    };
  }

  // Get prompt-type-specific stats (or aggregate as fallback)
  const typeStats = getPromptTypeStats(stats, promptType);

  // 1. Accuracy score (inverted: low accuracy = high score)
  let accuracyScore: number;
  if (typeStats.totalAttempts > 0) {
    const accuracyRate = (typeStats.correctAttempts / typeStats.totalAttempts) * 100;
    accuracyScore = 100 - accuracyRate;
  } else {
    accuracyScore = 50; // Unknown defaults to middle
  }

  // 2. Speed score (how far above threshold)
  // Speed is stored as per-word time in ms
  const threshold = calculateSpeedThreshold(wordCount) / wordCount;
  const avgTime = typeStats.averageResponseTimeMs || threshold;
  // Score based on ratio: 0.5x threshold = 0, 1.5x threshold = 100
  const speedRatio = avgTime / threshold;
  const speedScore = Math.min(100, Math.max(0, (speedRatio - 0.5) * 100));

  // 3. Recency score (days since last attempt, capped)
  let recencyScore: number;
  if (stats.lastAttemptTimestamp > 0) {
    const daysSinceAttempt = (Date.now() - stats.lastAttemptTimestamp) / (1000 * 60 * 60 * 24);
    recencyScore = Math.min(100, (daysSinceAttempt / RECENCY_CAP_DAYS) * 100);
  } else {
    recencyScore = 100; // Never attempted = max priority
  }

  // 4. Novelty score (fewer attempts = higher score)
  const totalAttempts = stats.totalAttempts || 0;
  const noveltyScore = Math.max(0, 100 - (totalAttempts / NOVELTY_CAP_ATTEMPTS) * 100);

  // Calculate weighted total
  const totalScore =
    accuracyScore * WEIGHTS.accuracy +
    speedScore * WEIGHTS.speed +
    recencyScore * WEIGHTS.recency +
    noveltyScore * WEIGHTS.novelty;

  return {
    vocabularyId,
    totalScore,
    factors: {
      accuracy: Math.round(accuracyScore),
      speed: Math.round(speedScore),
      recency: Math.round(recencyScore),
      novelty: Math.round(noveltyScore),
    },
  };
}

/**
 * Rank all vocabulary items by priority for a given prompt type
 */
export function rankVocabularyByPriority(
  vocabulary: VocabularyEntry[],
  promptType: PromptType,
  database: ResponseDatabase
): TrainingPriorityScore[] {
  const scores = vocabulary.map(entry => {
    const vocabularyId = generateVocabularyId(entry.word, entry.pinyin, entry.meaning);
    const stats = database.statistics[vocabularyId];
    const wordCount = entry.pinyin.split(/\s+/).length;

    return calculateTrainingPriority(vocabularyId, promptType, stats, wordCount);
  });

  // Sort by total score descending (highest priority first)
  return scores.sort((a, b) => b.totalScore - a.totalScore);
}

/**
 * Select a vocabulary item using weighted random from priority-ranked items
 *
 * Selection strategy:
 * - 60% chance: pick from top 20% of items
 * - 30% chance: pick from top 50% of items
 * - 10% chance: pick randomly (to occasionally reinforce strong items)
 */
export function selectWeightedByPriority(
  rankedItems: TrainingPriorityScore[],
  excludeIds: string[] = []
): string | null {
  // Filter out excluded items
  const available = rankedItems.filter(item => !excludeIds.includes(item.vocabularyId));

  if (available.length === 0) {
    return null;
  }

  // Determine which tier to select from
  const roll = Math.random();
  let pool: TrainingPriorityScore[];

  if (roll < 0.6) {
    // 60% chance: top 20%
    const top20Index = Math.max(1, Math.floor(available.length * 0.2));
    pool = available.slice(0, top20Index);
  } else if (roll < 0.9) {
    // 30% chance: top 50%
    const top50Index = Math.max(1, Math.floor(available.length * 0.5));
    pool = available.slice(0, top50Index);
  } else {
    // 10% chance: any item
    pool = available;
  }

  // Pick randomly from the selected pool
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex].vocabularyId;
}

/**
 * Count items that need more practice (above priority threshold)
 */
export function countItemsNeedingWork(
  vocabulary: VocabularyEntry[],
  database: ResponseDatabase,
  promptType: PromptType,
  threshold: number = PRIORITY_THRESHOLD
): number {
  let count = 0;

  for (const entry of vocabulary) {
    const vocabularyId = generateVocabularyId(entry.word, entry.pinyin, entry.meaning);
    const stats = database.statistics[vocabularyId];
    const wordCount = entry.pinyin.split(/\s+/).length;

    const priority = calculateTrainingPriority(vocabularyId, promptType, stats, wordCount);
    if (priority.totalScore >= threshold) {
      count++;
    }
  }

  return count;
}

/**
 * Get the priority threshold constant (for UI display)
 */
export function getPriorityThreshold(): number {
  return PRIORITY_THRESHOLD;
}

/**
 * Filter vocabulary to items that need work, sorted by priority
 */
export function filterToWeakItems(
  vocabulary: VocabularyEntry[],
  database: ResponseDatabase,
  promptType: PromptType,
  threshold: number = PRIORITY_THRESHOLD
): VocabularyEntry[] {
  const ranked = rankVocabularyByPriority(vocabulary, promptType, database);
  const weakIds = new Set(
    ranked
      .filter(item => item.totalScore >= threshold)
      .map(item => item.vocabularyId)
  );

  return vocabulary.filter(entry => {
    const vocabId = generateVocabularyId(entry.word, entry.pinyin, entry.meaning);
    return weakIds.has(vocabId);
  });
}
