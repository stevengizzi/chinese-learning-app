import { useEffect, useState } from 'react';
import { loadResponseDatabase, getVocabularyStats } from '../lib/responseTracking/storage';
import {
  formatResponseTime
} from '../lib/responseTracking/analytics';
import type { VocabularySpeedStats } from '../types/responseTracking';

interface SpeedFeedbackProps {
  responseTimeMs: number;
  wordCount: number;
  vocabularyId: string;
  wasCorrect: boolean;
  speedDrillConfig?: {
    baseThresholdMs: number;
    incrementPerWordMs: number;
  };
}

export function SpeedFeedback({ responseTimeMs, wordCount, vocabularyId, wasCorrect, speedDrillConfig }: SpeedFeedbackProps) {
  const [vocabStats, setVocabStats] = useState<VocabularySpeedStats | null>(null);

  useEffect(() => {
    loadResponseDatabase().then(db => {
      const stats = getVocabularyStats(db, vocabularyId);
      setVocabStats(stats);
    });
  }, [vocabularyId]);

  if (!wasCorrect) {
    return null; // Only show speed feedback for correct answers
  }

  // Calculate per-word response time
  const perWordTimeMs = wordCount > 0 ? responseTimeMs / wordCount : responseTimeMs;

  // Calculate threshold for this vocabulary term
  // Use provided config or defaults
  const config = speedDrillConfig || { baseThresholdMs: 3000, incrementPerWordMs: 1000 };
  const threshold = config.baseThresholdMs + Math.max(0, wordCount - 1) * config.incrementPerWordMs;
  const perWordThreshold = wordCount > 0 ? threshold / wordCount : threshold;

  // Determine if this meets the threshold
  const meetsThreshold = perWordTimeMs <= perWordThreshold;

  // Get vocabulary-specific stats
  const vocabAverage = vocabStats?.averageResponseTimeMs || 0;
  const vocabFastest = (vocabStats?.fastestResponseMs !== Infinity && vocabStats?.fastestResponseMs !== undefined) ? vocabStats.fastestResponseMs : 0;

  // Performance color based on threshold
  const colorClass = meetsThreshold
    ? 'text-green-600 dark:text-green-400'
    : 'text-orange-600 dark:text-orange-400';

  const bgClass = meetsThreshold
    ? 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700'
    : 'bg-orange-50 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700';

  return (
    <div className={`mt-4 p-4 rounded-lg border-2 ${bgClass}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className={`text-lg font-semibold ${colorClass}`}>
            {meetsThreshold ? '✓ Target met!' : 'Keep practicing!'}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Response: {formatResponseTime(responseTimeMs)}
            {wordCount > 1 && ` (${formatResponseTime(perWordTimeMs)}/word)`}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Target: {formatResponseTime(threshold)}
            {wordCount > 1 && ` (${formatResponseTime(perWordThreshold)}/word)`}
          </div>
        </div>
        <div className="text-right text-sm text-gray-500 dark:text-gray-400">
          {vocabAverage > 0 && (
            <div>Your avg: {formatResponseTime(vocabAverage)}/word</div>
          )}
          {vocabFastest > 0 && (
            <div>Your best: {formatResponseTime(vocabFastest)}/word</div>
          )}
          {vocabAverage === 0 && vocabFastest === 0 && (
            <div className="text-gray-400">First attempt!</div>
          )}
        </div>
      </div>
    </div>
  );
}
