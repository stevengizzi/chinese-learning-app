import type { DashboardStats, StreakData } from '../../types/dashboard';
import { getTodayDate, getYesterdayDate } from './storage';

/**
 * Check if the current streak is still active (practiced today or yesterday)
 */
export function isStreakActive(streaks: StreakData): boolean {
  const today = getTodayDate();
  const yesterday = getYesterdayDate();
  return streaks.lastActiveDate === today || streaks.lastActiveDate === yesterday;
}

/**
 * Check if user has practiced today
 */
export function hasPracticedToday(streaks: StreakData): boolean {
  return streaks.lastActiveDate === getTodayDate();
}

/**
 * Calculate the number of days between two dates
 */
function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Update streaks when user practices
 * Called when a session completes
 */
export function updateStreaksOnPractice(stats: DashboardStats): DashboardStats {
  const today = getTodayDate();
  const yesterday = getYesterdayDate();
  const { lastActiveDate, currentStreak, longestStreak } = stats.streaks;

  let newCurrentStreak = currentStreak;
  let newLongestStreak = longestStreak;

  if (lastActiveDate === today) {
    // Already practiced today, no change needed
    return stats;
  }

  if (lastActiveDate === yesterday) {
    // Continuing the streak!
    newCurrentStreak = currentStreak + 1;
  } else if (lastActiveDate === '' || daysBetween(lastActiveDate, today) > 1) {
    // First practice or streak was broken, start fresh
    newCurrentStreak = 1;
  }

  // Update longest streak if we've beaten it
  if (newCurrentStreak > newLongestStreak) {
    newLongestStreak = newCurrentStreak;
  }

  return {
    ...stats,
    streaks: {
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      lastActiveDate: today
    }
  };
}

/**
 * Check and potentially reset streak on app load
 * If user hasn't practiced for > 1 day, streak is broken
 */
export function validateStreakOnLoad(stats: DashboardStats): DashboardStats {
  const today = getTodayDate();
  const yesterday = getYesterdayDate();
  const { lastActiveDate, currentStreak } = stats.streaks;

  // No previous activity
  if (!lastActiveDate) {
    return stats;
  }

  // Practiced today or yesterday - streak still valid
  if (lastActiveDate === today || lastActiveDate === yesterday) {
    return stats;
  }

  // Streak is broken (more than 1 day since last practice)
  if (currentStreak > 0) {
    return {
      ...stats,
      streaks: {
        ...stats.streaks,
        currentStreak: 0
        // Note: We don't update lastActiveDate here, that only happens on practice
      }
    };
  }

  return stats;
}

/**
 * Calculate streaks from daily activity history
 * Used for migration and recalculation
 */
export function calculateStreaksFromActivity(
  dailyActivity: Record<string, unknown>
): StreakData {
  const dates = Object.keys(dailyActivity).sort();

  if (dates.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: ''
    };
  }

  const today = getTodayDate();
  const yesterday = getYesterdayDate();
  const lastActiveDate = dates[dates.length - 1];

  // Calculate longest streak
  let longestStreak = 1;
  let tempStreak = 1;

  for (let i = 1; i < dates.length; i++) {
    const diff = daysBetween(dates[i - 1], dates[i]);
    if (diff === 1) {
      tempStreak += 1;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    } else {
      tempStreak = 1;
    }
  }

  // Calculate current streak
  let currentStreak = 0;

  if (lastActiveDate === today || lastActiveDate === yesterday) {
    currentStreak = 1;

    // Count backwards from last active date
    let checkDate = new Date(lastActiveDate);
    checkDate.setDate(checkDate.getDate() - 1);
    let checkDateStr = checkDate.toISOString().split('T')[0];

    while (dailyActivity[checkDateStr]) {
      currentStreak += 1;
      checkDate.setDate(checkDate.getDate() - 1);
      checkDateStr = checkDate.toISOString().split('T')[0];
    }
  }

  return {
    currentStreak,
    longestStreak,
    lastActiveDate
  };
}

/**
 * Get streak milestone information
 */
export function getStreakMilestone(streak: number): { milestone: number; next: number } | null {
  const milestones = [7, 14, 30, 60, 100, 180, 365];

  for (let i = 0; i < milestones.length; i++) {
    if (streak < milestones[i]) {
      return {
        milestone: i > 0 ? milestones[i - 1] : 0,
        next: milestones[i]
      };
    }
    if (streak === milestones[i]) {
      return {
        milestone: milestones[i],
        next: milestones[i + 1] || milestones[i] * 2
      };
    }
  }

  // Beyond all milestones
  return {
    milestone: milestones[milestones.length - 1],
    next: streak + 100
  };
}

/**
 * Get a motivational message based on streak
 */
export function getStreakMessage(streak: number, isActive: boolean): string {
  if (!isActive && streak === 0) {
    return 'Start your streak today!';
  }

  if (!isActive && streak > 0) {
    return 'Practice today to keep your streak!';
  }

  if (streak === 1) {
    return 'Great start! Keep going tomorrow!';
  }

  if (streak < 7) {
    return `${streak} days strong! Almost a week!`;
  }

  if (streak === 7) {
    return 'One week streak! Amazing!';
  }

  if (streak < 30) {
    return `${streak} days! Heading for a month!`;
  }

  if (streak === 30) {
    return 'One month streak! Incredible!';
  }

  if (streak < 100) {
    return `${streak} days! Triple digits await!`;
  }

  if (streak === 100) {
    return '100 day streak! You\'re unstoppable!';
  }

  return `${streak} days! You\'re a legend!`;
}
