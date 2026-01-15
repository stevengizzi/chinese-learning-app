/**
 * Response Time Analytics Utilities
 *
 * Functions for analyzing and reporting on response time data
 */

import type { ResponseDatabase, VocabularySpeedStats, SpeedPerformance, SpeedReport } from '../../types/responseTracking';
import type { Session } from '../../types/session';
import { calculateGlobalAverage } from './storage';

/**
 * Get N slowest vocabulary entries
 */
export function getSlowestEntries(
  database: ResponseDatabase,
  count: number
): VocabularySpeedStats[] {
  const allStats = Object.values(database.statistics);
  const validStats = allStats.filter(s => s.correctAttempts > 0);

  return validStats
    .sort((a, b) => b.averageResponseTimeMs - a.averageResponseTimeMs)
    .slice(0, count);
}

/**
 * Get N fastest vocabulary entries
 */
export function getFastestEntries(
  database: ResponseDatabase,
  count: number
): VocabularySpeedStats[] {
  const allStats = Object.values(database.statistics);
  const validStats = allStats.filter(s => s.correctAttempts > 0);

  return validStats
    .sort((a, b) => a.averageResponseTimeMs - b.averageResponseTimeMs)
    .slice(0, count);
}

/**
 * Determine speed performance level based on response time vs average
 */
export function getSpeedPerformance(
  responseTimeMs: number,
  globalAverageMs: number
): SpeedPerformance {
  const ratio = responseTimeMs / globalAverageMs;

  if (ratio <= 0.7) return 'excellent';  // 30% faster than average
  if (ratio <= 0.9) return 'good';       // 10% faster than average
  if (ratio <= 1.1) return 'average';    // Within 10% of average
  if (ratio <= 1.5) return 'slow';       // 50% slower than average
  return 'very-slow';                     // More than 50% slower
}

/**
 * Get performance color for UI
 */
export function getPerformanceColor(performance: SpeedPerformance): string {
  switch (performance) {
    case 'excellent': return 'text-green-600 dark:text-green-400';
    case 'good': return 'text-blue-600 dark:text-blue-400';
    case 'average': return 'text-yellow-600 dark:text-yellow-400';
    case 'slow': return 'text-orange-600 dark:text-orange-400';
    case 'very-slow': return 'text-red-600 dark:text-red-400';
  }
}

/**
 * Get performance message for feedback
 */
export function getPerformanceMessage(performance: SpeedPerformance): string {
  switch (performance) {
    case 'excellent': return 'Excellent speed!';
    case 'good': return 'Good pace!';
    case 'average': return 'Average speed';
    case 'slow': return 'A bit slow';
    case 'very-slow': return 'Too slow - practice more!';
  }
}

/**
 * Format milliseconds to readable time
 */
export function formatResponseTime(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Calculate improvement percentage
 */
export function calculateImprovement(
  currentStats: VocabularySpeedStats,
  historicalAverage: number
): number {
  if (historicalAverage === 0) return 0;
  return ((historicalAverage - currentStats.averageResponseTimeMs) / historicalAverage) * 100;
}

/**
 * Generate speed report for a session
 */
export function generateSpeedReport(
  session: Session,
  database: ResponseDatabase
): SpeedReport {
  const timings = session.responseTimings || [];
  const globalAverage = calculateGlobalAverage(database);

  // Calculate session metrics
  const correctTimings = timings.filter(t => t.wasCorrect);
  const sessionAverageMs = correctTimings.length > 0
    ? correctTimings.reduce((sum, t) => sum + t.responseTimeMs, 0) / correctTimings.length
    : 0;

  const fastestResponseMs = correctTimings.length > 0
    ? Math.min(...correctTimings.map(t => t.responseTimeMs))
    : 0;

  const slowestResponseMs = correctTimings.length > 0
    ? Math.max(...correctTimings.map(t => t.responseTimeMs))
    : 0;

  // Calculate improvement
  const improvement = globalAverage > 0
    ? ((globalAverage - sessionAverageMs) / globalAverage) * 100
    : 0;

  // Get fastest and slowest entries from this session
  const sortedTimings = [...correctTimings].sort((a, b) => a.responseTimeMs - b.responseTimeMs);
  const fastestEntries = sortedTimings.slice(0, 5).map(t => ({
    character: t.character,
    timeMs: t.responseTimeMs
  }));

  const slowestEntries = sortedTimings.slice(-5).reverse().map(t => ({
    character: t.character,
    timeMs: t.responseTimeMs
  }));

  return {
    sessionAverageMs,
    globalAverageMs: globalAverage,
    fastestResponseMs,
    slowestResponseMs,
    improvement,
    entriesPracticed: new Set(timings.map(t => t.vocabularyId)).size,
    fastestEntries,
    slowestEntries
  };
}

/**
 * Get entries slower than average (for Speed Drill mode)
 * @deprecated Use getEntriesAboveThreshold instead
 */
export function getSlowerThanAverageEntries(
  database: ResponseDatabase
): VocabularySpeedStats[] {
  const globalAverage = calculateGlobalAverage(database);
  const allStats = Object.values(database.statistics);

  return allStats.filter(s =>
    s.correctAttempts > 0 &&
    s.averageResponseTimeMs > globalAverage
  );
}
