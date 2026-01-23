import type {
  DashboardStats,
  DailyActivity,
  SessionSummary,
  AllTimeStats
} from '../../types/dashboard';
import type { Session } from '../../types/session';
import type { ResponseDatabase } from '../../types/responseTracking';

const DASHBOARD_STATS_KEY = 'dashboard-stats';
const CURRENT_VERSION = 1;
const MAX_RECENT_SESSIONS = 20;

/**
 * Create an empty dashboard stats object
 */
export function createEmptyDashboardStats(): DashboardStats {
  return {
    version: CURRENT_VERSION,
    streaks: {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: ''
    },
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
}

/**
 * Create an empty daily activity record
 */
export function createEmptyDailyActivity(date: string): DailyActivity {
  return {
    date,
    totalExercises: 0,
    totalCorrect: 0,
    totalTimeMs: 0,
    sessionsCompleted: 0,
    vocabularyPracticed: []
  };
}

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 */
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get yesterday's date as ISO string
 */
export function getYesterdayDate(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

/**
 * Load dashboard stats from localStorage
 */
export function loadDashboardStats(): DashboardStats {
  try {
    const data = localStorage.getItem(DASHBOARD_STATS_KEY);
    if (data) {
      const parsed = JSON.parse(data) as DashboardStats;
      // Handle version migrations if needed in the future
      return parsed;
    }
  } catch (error) {
    console.error('Failed to load dashboard stats:', error);
  }
  return createEmptyDashboardStats();
}

/**
 * Save dashboard stats to localStorage
 */
export function saveDashboardStats(stats: DashboardStats): void {
  try {
    stats.lastUpdated = Date.now();
    localStorage.setItem(DASHBOARD_STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Failed to save dashboard stats:', error);
  }
}

/**
 * Update daily activity with session data
 */
export function updateDailyActivity(
  stats: DashboardStats,
  session: Session
): DashboardStats {
  const today = getTodayDate();

  // Get or create today's activity
  const activity = stats.dailyActivity[today] || createEmptyDailyActivity(today);

  // Update activity from session
  const sessionExercises = session.attempts.length;
  const sessionCorrect = session.attempts.filter(a => a.score.correct === a.score.total).length;
  const sessionTimeMs = session.accumulatedTimeMs || 0;

  // Get unique vocabulary IDs from this session
  const sessionVocabIds = session.responseTimings?.map(t => t.vocabularyId) || [];
  const uniqueSessionVocabIds = [...new Set(sessionVocabIds)];

  // Merge with existing vocabulary practiced today
  const existingVocabSet = new Set(activity.vocabularyPracticed);
  uniqueSessionVocabIds.forEach(id => existingVocabSet.add(id));

  activity.totalExercises += sessionExercises;
  activity.totalCorrect += sessionCorrect;
  activity.totalTimeMs += sessionTimeMs;
  activity.sessionsCompleted += 1;
  activity.vocabularyPracticed = Array.from(existingVocabSet);

  // Update stats
  const updatedStats = {
    ...stats,
    dailyActivity: {
      ...stats.dailyActivity,
      [today]: activity
    }
  };

  return updatedStats;
}

/**
 * Add a session summary to recent sessions
 */
export function addSessionSummary(
  stats: DashboardStats,
  session: Session
): DashboardStats {
  const summary: SessionSummary = {
    id: session.id,
    startTime: session.startTime,
    endTime: session.endTime || Date.now(),
    exerciseType: session.exerciseType,
    playMode: session.playMode,
    totalExercises: session.attempts.length,
    accuracy: session.statistics.averageAccuracy,
    averageResponseTimeMs: session.statistics.averageTimePerCorrectAnswer || 0
  };

  // Add to front of list and limit to MAX_RECENT_SESSIONS
  const recentSessions = [summary, ...stats.recentSessions].slice(0, MAX_RECENT_SESSIONS);

  return {
    ...stats,
    recentSessions
  };
}

/**
 * Update all-time stats with session data
 */
export function updateAllTimeStats(
  stats: DashboardStats,
  session: Session
): DashboardStats {
  const today = getTodayDate();
  const sessionExercises = session.attempts.length;
  const sessionCorrect = session.attempts.filter(a => a.score.correct === a.score.total).length;
  const sessionTimeMs = session.accumulatedTimeMs || 0;

  const allTimeStats: AllTimeStats = {
    totalExercises: stats.allTimeStats.totalExercises + sessionExercises,
    totalCorrect: stats.allTimeStats.totalCorrect + sessionCorrect,
    totalTimeMs: stats.allTimeStats.totalTimeMs + sessionTimeMs,
    totalSessions: stats.allTimeStats.totalSessions + 1,
    firstPracticeDate: stats.allTimeStats.firstPracticeDate || today
  };

  return {
    ...stats,
    allTimeStats
  };
}

/**
 * Update dashboard stats when a session completes
 * This is the main entry point called from ExerciseContext
 */
export function updateDashboardOnSessionComplete(session: Session): void {
  let stats = loadDashboardStats();

  // Update daily activity
  stats = updateDailyActivity(stats, session);

  // Add session summary
  stats = addSessionSummary(stats, session);

  // Update all-time stats
  stats = updateAllTimeStats(stats, session);

  // Update streaks (imported from streaks.ts)
  stats = updateStreaksOnActivity(stats);

  // Save
  saveDashboardStats(stats);
}

/**
 * Update streaks when activity occurs
 * Simple implementation - full streak logic is in streaks.ts
 */
function updateStreaksOnActivity(stats: DashboardStats): DashboardStats {
  const today = getTodayDate();
  const yesterday = getYesterdayDate();
  const lastActive = stats.streaks.lastActiveDate;

  let { currentStreak, longestStreak } = stats.streaks;

  if (lastActive === today) {
    // Already practiced today, streak unchanged
  } else if (lastActive === yesterday) {
    // Continuing streak from yesterday
    currentStreak += 1;
  } else if (lastActive === '') {
    // First time practicing
    currentStreak = 1;
  } else {
    // Streak was broken, starting fresh
    currentStreak = 1;
  }

  // Update longest streak if current exceeds it
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  return {
    ...stats,
    streaks: {
      currentStreak,
      longestStreak,
      lastActiveDate: today
    }
  };
}

/**
 * Migrate existing response tracking data to dashboard stats
 * Called when dashboard is first loaded and no stats exist
 */
export function migrateExistingData(responseDb: ResponseDatabase): DashboardStats {
  const stats = createEmptyDashboardStats();

  if (!responseDb.records || responseDb.records.length === 0) {
    return stats;
  }

  // Group records by date
  const recordsByDate: Record<string, typeof responseDb.records> = {};

  for (const record of responseDb.records) {
    const date = new Date(record.timestamp).toISOString().split('T')[0];
    if (!recordsByDate[date]) {
      recordsByDate[date] = [];
    }
    recordsByDate[date].push(record);
  }

  // Build daily activity from records
  for (const [date, records] of Object.entries(recordsByDate)) {
    const activity = createEmptyDailyActivity(date);
    const vocabSet = new Set<string>();

    for (const record of records) {
      activity.totalExercises += 1;
      if (record.wasCorrect) {
        activity.totalCorrect += 1;
      }
      activity.totalTimeMs += record.responseTimeMs;
      vocabSet.add(record.vocabularyId);
    }

    activity.vocabularyPracticed = Array.from(vocabSet);
    activity.sessionsCompleted = 1; // Approximate - we don't have exact session boundaries

    stats.dailyActivity[date] = activity;
  }

  // Calculate all-time stats
  let totalExercises = 0;
  let totalCorrect = 0;
  let totalTimeMs = 0;
  let firstDate: string | null = null;

  const sortedDates = Object.keys(stats.dailyActivity).sort();
  for (const date of sortedDates) {
    const activity = stats.dailyActivity[date];
    totalExercises += activity.totalExercises;
    totalCorrect += activity.totalCorrect;
    totalTimeMs += activity.totalTimeMs;
    if (!firstDate) {
      firstDate = date;
    }
  }

  stats.allTimeStats = {
    totalExercises,
    totalCorrect,
    totalTimeMs,
    totalSessions: sortedDates.length, // Approximate
    firstPracticeDate: firstDate
  };

  // Calculate streaks from sorted dates
  if (sortedDates.length > 0) {
    const today = getTodayDate();
    const yesterday = getYesterdayDate();

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    // Calculate longest streak by iterating through consecutive days
    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        tempStreak += 1;
      } else {
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
        tempStreak = 1;
      }
    }
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }

    // Calculate current streak (counting back from today/yesterday)
    const lastActiveDate = sortedDates[sortedDates.length - 1];
    if (lastActiveDate === today || lastActiveDate === yesterday) {
      currentStreak = 1;
      let checkDate = new Date(lastActiveDate);
      checkDate.setDate(checkDate.getDate() - 1);

      while (stats.dailyActivity[checkDate.toISOString().split('T')[0]]) {
        currentStreak += 1;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    stats.streaks = {
      currentStreak,
      longestStreak,
      lastActiveDate: lastActiveDate
    };
  }

  return stats;
}

/**
 * Check if migration is needed and perform it
 */
export function loadOrMigrateDashboardStats(responseDb: ResponseDatabase | null): DashboardStats {
  const existingStats = loadDashboardStats();

  // If we have existing stats with activity, use them
  if (Object.keys(existingStats.dailyActivity).length > 0) {
    return existingStats;
  }

  // If no existing stats but we have response data, migrate
  if (responseDb && responseDb.records && responseDb.records.length > 0) {
    const migratedStats = migrateExistingData(responseDb);
    saveDashboardStats(migratedStats);
    return migratedStats;
  }

  return existingStats;
}
