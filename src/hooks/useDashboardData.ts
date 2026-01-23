import { useState, useEffect, useCallback } from 'react';
import type { DashboardStats, HeroStatsData, MasteryBreakdown, CalendarDay, SpeedDataPoint } from '../types/dashboard';
import type { VocabularyEntry } from '../types/vocabulary';
import type { ResponseDatabase } from '../types/responseTracking';
import { loadOrMigrateDashboardStats } from '../lib/dashboard/storage';
import { isStreakActive as checkStreakActive } from '../lib/dashboard/streaks';
import { getMasteryBreakdown, getOverallAccuracy } from '../lib/dashboard/mastery';
import { generateCalendarData, getActivityForPeriod } from '../lib/dashboard/calendar';

export interface DashboardData {
  stats: DashboardStats;
  heroStats: HeroStatsData;
  masteryBreakdown: MasteryBreakdown;
  calendarData: CalendarDay[][];
  speedData: SpeedDataPoint[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Calculate speed trend data from daily activity
 */
function calculateSpeedTrends(stats: DashboardStats, days: number = 30): SpeedDataPoint[] {
  const today = new Date();
  const dataPoints: SpeedDataPoint[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const activity = stats.dailyActivity[dateStr];
    if (activity && activity.totalExercises > 0) {
      dataPoints.push({
        date: dateStr,
        averageMs: Math.round(activity.totalTimeMs / activity.totalExercises),
        exerciseCount: activity.totalExercises
      });
    }
  }

  return dataPoints;
}

/**
 * Hook for loading and computing dashboard data
 */
export function useDashboardData(
  vocabulary: VocabularyEntry[] | null,
  responseDatabase: ResponseDatabase | null
): DashboardData {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(() => {
    setIsLoading(true);
    setError(null);

    try {
      const loadedStats = loadOrMigrateDashboardStats(responseDatabase);
      setStats(loadedStats);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [responseDatabase]);

  // Load on mount and when dependencies change
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute derived data
  const masteryBreakdown = vocabulary && responseDatabase
    ? getMasteryBreakdown(vocabulary, responseDatabase)
    : {
        mastered: [],
        learning: [],
        struggling: [],
        new: [],
        counts: { mastered: 0, learning: 0, struggling: 0, new: 0, total: 0 }
      };

  const overallAccuracy = responseDatabase
    ? getOverallAccuracy(responseDatabase)
    : 0;

  const calendarData = stats
    ? generateCalendarData(stats, 52)
    : [];

  const speedData = stats
    ? calculateSpeedTrends(stats, 30)
    : [];

  const heroStats: HeroStatsData = stats ? {
    currentStreak: stats.streaks.currentStreak,
    longestStreak: stats.streaks.longestStreak,
    isStreakActive: checkStreakActive(stats.streaks),
    wordsMastered: masteryBreakdown.counts.mastered,
    totalWords: masteryBreakdown.counts.total,
    masteryPercentage: masteryBreakdown.counts.total > 0
      ? Math.round((masteryBreakdown.counts.mastered / masteryBreakdown.counts.total) * 100)
      : 0,
    overallAccuracy,
    totalExercises: stats.allTimeStats.totalExercises
  } : {
    currentStreak: 0,
    longestStreak: 0,
    isStreakActive: false,
    wordsMastered: 0,
    totalWords: vocabulary?.length || 0,
    masteryPercentage: 0,
    overallAccuracy: 0,
    totalExercises: 0
  };

  // Create empty stats if none loaded
  const finalStats: DashboardStats = stats || {
    version: 1,
    streaks: { currentStreak: 0, longestStreak: 0, lastActiveDate: '' },
    dailyActivity: {},
    recentSessions: [],
    allTimeStats: {
      totalExercises: 0,
      totalCorrect: 0,
      totalTimeMs: 0,
      totalSessions: 0,
      firstPracticeDate: null
    },
    lastUpdated: Date.now()
  };

  return {
    stats: finalStats,
    heroStats,
    masteryBreakdown,
    calendarData,
    speedData,
    isLoading,
    error,
    refresh: loadData
  };
}

/**
 * Hook for getting activity stats for a specific period
 */
export function useActivityPeriod(stats: DashboardStats, days: number) {
  return getActivityForPeriod(stats, days);
}
