/**
 * Statistics storage for Similar Characters practice.
 * Tracks per-pair accuracy and performance over time.
 */

import type {
  SimilarCharactersStats,
  CharacterPairStats,
  SimilarCharactersAttempt,
} from '../types/similarCharacters';

const STATS_CACHE_KEY = 'similar-characters-stats';
const MAX_RECENT_RESULTS = 10;

/**
 * Generate a consistent pair ID (alphabetically sorted).
 */
export function generatePairId(charA: string, charB: string): string {
  return [charA, charB].sort().join(':');
}

/**
 * Create an empty statistics database.
 */
function createEmptyStats(): SimilarCharactersStats {
  return {
    version: 1,
    pairStats: {},
    lastUpdated: Date.now(),
  };
}

/**
 * Create initial stats for a new character pair.
 */
function createPairStats(charA: string, charB: string): CharacterPairStats {
  return {
    pairId: generatePairId(charA, charB),
    characterA: charA,
    characterB: charB,
    totalAttempts: 0,
    correctAttempts: 0,
    averageResponseTimeMs: 0,
    lastAttemptTimestamp: 0,
    recentResults: [],
  };
}

/**
 * Load statistics from localStorage.
 */
export function loadSimilarCharactersStats(): SimilarCharactersStats {
  try {
    const cached = localStorage.getItem(STATS_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      // Validate structure
      if (parsed && typeof parsed.version === 'number' && parsed.pairStats) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn('Failed to load similar characters stats:', error);
  }
  return createEmptyStats();
}

/**
 * Save statistics to localStorage.
 */
export function saveSimilarCharactersStats(stats: SimilarCharactersStats): void {
  try {
    stats.lastUpdated = Date.now();
    localStorage.setItem(STATS_CACHE_KEY, JSON.stringify(stats));
  } catch (error) {
    console.warn('Failed to save similar characters stats:', error);
  }
}

/**
 * Record an attempt and update statistics.
 */
export function recordAttempt(
  stats: SimilarCharactersStats,
  attempt: SimilarCharactersAttempt,
  characterA: string,
  characterB: string
): SimilarCharactersStats {
  const pairId = generatePairId(characterA, characterB);
  const existing = stats.pairStats[pairId] || createPairStats(characterA, characterB);

  // Update attempt counts
  existing.totalAttempts++;
  if (attempt.wasCorrect) {
    existing.correctAttempts++;
  }

  // Update average response time
  const oldTotal = existing.averageResponseTimeMs * (existing.totalAttempts - 1);
  existing.averageResponseTimeMs = (oldTotal + attempt.responseTimeMs) / existing.totalAttempts;

  // Update timestamp
  existing.lastAttemptTimestamp = attempt.timestamp;

  // Update recent results (keep last N)
  existing.recentResults = [
    attempt.wasCorrect,
    ...existing.recentResults.slice(0, MAX_RECENT_RESULTS - 1),
  ];

  return {
    ...stats,
    pairStats: {
      ...stats.pairStats,
      [pairId]: existing,
    },
    lastUpdated: Date.now(),
  };
}

/**
 * Record multiple attempts at once (for batch updates).
 */
export function recordAttempts(
  stats: SimilarCharactersStats,
  attempts: Array<{
    attempt: SimilarCharactersAttempt;
    characterA: string;
    characterB: string;
  }>
): SimilarCharactersStats {
  let result = stats;
  for (const { attempt, characterA, characterB } of attempts) {
    result = recordAttempt(result, attempt, characterA, characterB);
  }
  return result;
}

/**
 * Get accuracy for a specific character pair.
 */
export function getPairAccuracy(stats: SimilarCharactersStats, pairId: string): number | null {
  const pairStats = stats.pairStats[pairId];
  if (!pairStats || pairStats.totalAttempts === 0) {
    return null;
  }
  return (pairStats.correctAttempts / pairStats.totalAttempts) * 100;
}

/**
 * Get weak pairs that need more practice (below accuracy threshold).
 */
export function getWeakPairs(
  stats: SimilarCharactersStats,
  threshold: number = 70
): CharacterPairStats[] {
  return Object.values(stats.pairStats)
    .filter(pair => {
      if (pair.totalAttempts < 3) return false; // Need minimum attempts
      const accuracy = (pair.correctAttempts / pair.totalAttempts) * 100;
      return accuracy < threshold;
    })
    .sort((a, b) => {
      const accA = a.correctAttempts / a.totalAttempts;
      const accB = b.correctAttempts / b.totalAttempts;
      return accA - accB; // Lowest accuracy first
    });
}

/**
 * Get all pairs sorted by various criteria.
 */
export function getAllPairsSorted(
  stats: SimilarCharactersStats,
  sortBy: 'accuracy' | 'attempts' | 'recent' = 'accuracy'
): CharacterPairStats[] {
  const pairs = Object.values(stats.pairStats);

  switch (sortBy) {
    case 'accuracy':
      return pairs.sort((a, b) => {
        if (a.totalAttempts === 0) return 1;
        if (b.totalAttempts === 0) return -1;
        const accA = a.correctAttempts / a.totalAttempts;
        const accB = b.correctAttempts / b.totalAttempts;
        return accA - accB;
      });
    case 'attempts':
      return pairs.sort((a, b) => b.totalAttempts - a.totalAttempts);
    case 'recent':
      return pairs.sort((a, b) => b.lastAttemptTimestamp - a.lastAttemptTimestamp);
    default:
      return pairs;
  }
}

/**
 * Get statistics summary.
 */
export function getStatsSummary(stats: SimilarCharactersStats): {
  totalPairs: number;
  totalAttempts: number;
  overallAccuracy: number;
  weakPairsCount: number;
} {
  const pairs = Object.values(stats.pairStats);
  const totalAttempts = pairs.reduce((sum, p) => sum + p.totalAttempts, 0);
  const totalCorrect = pairs.reduce((sum, p) => sum + p.correctAttempts, 0);
  const weakPairs = getWeakPairs(stats);

  return {
    totalPairs: pairs.length,
    totalAttempts,
    overallAccuracy: totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0,
    weakPairsCount: weakPairs.length,
  };
}

/**
 * Clear all statistics.
 */
export function clearStats(): void {
  localStorage.removeItem(STATS_CACHE_KEY);
}
