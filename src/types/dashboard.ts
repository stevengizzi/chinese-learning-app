import type { ExerciseType, PlayMode } from './exercise';

/**
 * Dashboard Statistics - stored in localStorage
 */
export interface DashboardStats {
  version: number;
  streaks: StreakData;
  dailyActivity: Record<string, DailyActivity>;  // Keyed by "YYYY-MM-DD"
  recentSessions: SessionSummary[];               // Last 20 sessions
  allTimeStats: AllTimeStats;
  lastUpdated: number;
}

/**
 * Streak tracking data
 */
export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;  // ISO date "YYYY-MM-DD"
}

/**
 * Activity data for a single day
 */
export interface DailyActivity {
  date: string;  // "YYYY-MM-DD"
  totalExercises: number;
  totalCorrect: number;
  totalTimeMs: number;
  sessionsCompleted: number;
  vocabularyPracticed: string[];  // Unique vocabulary IDs practiced
}

/**
 * Summary of a completed session
 */
export interface SessionSummary {
  id: string;
  startTime: number;
  endTime: number;
  exerciseType: ExerciseType;
  playMode: PlayMode;
  totalExercises: number;
  correctExercises: number;
  accuracy: number;  // 0-100
  averageResponseTimeMs: number;
  totalTimeMs: number;  // Total session duration
  fastestResponseMs?: number;
  slowestResponseMs?: number;
  vocabularyPracticed: number;  // Count of unique vocabulary items
}

/**
 * All-time aggregated statistics
 */
export interface AllTimeStats {
  totalExercises: number;
  totalCorrect: number;
  totalTimeMs: number;
  totalSessions: number;
  firstPracticeDate: string | null;  // ISO date or null if never practiced
}

/**
 * Mastery levels for vocabulary items
 */
export type MasteryLevel = 'mastered' | 'learning' | 'struggling' | 'new';

/**
 * Mastery information for a single vocabulary entry
 */
export interface VocabularyMasteryInfo {
  vocabularyId: string;
  character: string;
  pinyin: string;
  meaning: string;
  masteryLevel: MasteryLevel;
  accuracy: number;  // 0-100
  averageSpeedMs: number;
  totalAttempts: number;
  lastPracticed: number | null;  // timestamp or null
}

/**
 * Breakdown of vocabulary by mastery level
 */
export interface MasteryBreakdown {
  mastered: VocabularyMasteryInfo[];
  learning: VocabularyMasteryInfo[];
  struggling: VocabularyMasteryInfo[];
  new: VocabularyMasteryInfo[];
  counts: {
    mastered: number;
    learning: number;
    struggling: number;
    new: number;
    total: number;
  };
}

/**
 * Activity calendar data for a single day
 */
export interface CalendarDay {
  date: string;  // "YYYY-MM-DD"
  intensity: 0 | 1 | 2 | 3 | 4;  // Activity intensity level
  exercises: number;
  isToday: boolean;
  isFuture: boolean;
}

/**
 * Speed trend data point
 */
export interface SpeedDataPoint {
  date: string;  // "YYYY-MM-DD"
  averageMs: number;
  exerciseCount: number;
}

/**
 * Dashboard hero stats
 */
export interface HeroStatsData {
  currentStreak: number;
  longestStreak: number;
  isStreakActive: boolean;  // practiced today or yesterday
  wordsMastered: number;
  totalWords: number;
  masteryPercentage: number;
  overallAccuracy: number;
  totalExercises: number;
}

/**
 * Mastery thresholds for determining vocabulary levels
 */
export const MASTERY_THRESHOLDS = {
  mastered: {
    accuracy: 90,
    minAttempts: 5,
    speedRatio: 0.8  // Must be <= 80% of global average (faster)
  },
  learning: {
    accuracy: 70,
    minAttempts: 3
  },
  struggling: {
    accuracy: 0,  // Any accuracy below learning threshold
    minAttempts: 1
  }
  // 'new' = 0 attempts
} as const;

/**
 * Activity intensity thresholds for calendar
 */
export const INTENSITY_THRESHOLDS = {
  level1: 1,   // 1-10 exercises
  level2: 11,  // 11-25 exercises
  level3: 26,  // 26-50 exercises
  level4: 51   // 51+ exercises
} as const;

/**
 * Mastery level colors for UI
 */
export const MASTERY_COLORS = {
  mastered: '#10B981',   // Green
  learning: '#3B82F6',   // Blue
  struggling: '#F59E0B', // Orange/Amber
  new: '#9CA3AF'         // Gray
} as const;

/**
 * Calendar intensity colors (green scale)
 */
export const INTENSITY_COLORS = {
  0: 'bg-gray-100 dark:bg-gray-700',
  1: 'bg-green-200 dark:bg-green-900',
  2: 'bg-green-400 dark:bg-green-700',
  3: 'bg-green-500 dark:bg-green-600',
  4: 'bg-green-600 dark:bg-green-500'
} as const;
