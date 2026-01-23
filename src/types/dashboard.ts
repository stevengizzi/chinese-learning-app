import type { ExerciseType, PlayMode } from './exercise';
import type { PromptType } from './responseTracking';

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
 * Mastery information for a single prompt type
 */
export interface PromptTypeMasteryInfo {
  promptType: PromptType;
  masteryLevel: MasteryLevel;
  accuracy: number;  // 0-100
  averageSpeedMs: number;
  totalAttempts: number;
  lastPracticed: number | null;
}

/**
 * Mastery information for a single vocabulary entry
 */
export interface VocabularyMasteryInfo {
  vocabularyId: string;
  character: string;
  pinyin: string;
  meaning: string;
  masteryLevel: MasteryLevel;  // Overall mastery (based on prompt type completion)
  accuracy: number;  // 0-100 (overall)
  averageSpeedMs: number;
  totalAttempts: number;
  lastPracticed: number | null;  // timestamp or null
  byPromptType: Record<PromptType, PromptTypeMasteryInfo>;  // Per-prompt-type mastery
  promptTypesMastered: number;  // Count of prompt types at 'mastered' level (0-4)
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
 * Uses rolling window of last 15 attempts for accuracy and speed calculations
 */
export const MASTERY_THRESHOLDS = {
  rollingWindow: 15,  // Number of recent attempts to consider
  mastered: {
    accuracyPercent: 80,    // Need 80% in rolling window (12 out of 15)
    baseSpeedMs: 2500,      // Base threshold for 1-word answers
    speedPerWordMs: 750     // Additional ms per extra word
  },
  learning: {
    accuracyPercent: 60     // Need 60% accuracy in rolling window
  },
  struggling: {
    accuracyPercent: 0,     // Any accuracy below learning threshold
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
 * Prompt type display names and colors
 */
export const PROMPT_TYPE_CONFIG: Record<PromptType, { label: string; shortLabel: string; color: string }> = {
  'character-to-pinyin': { label: '字 → 拼音', shortLabel: '字→拼', color: '#8B5CF6' },    // Purple
  'character-to-english': { label: '字 → EN', shortLabel: '字→EN', color: '#EC4899' },    // Pink
  'pinyin-to-english': { label: '拼音 → EN', shortLabel: '拼→EN', color: '#06B6D4' },     // Cyan
  'english-to-pinyin': { label: 'EN → 拼音', shortLabel: 'EN→拼', color: '#F97316' }      // Orange
} as const;

/**
 * All prompt types in display order
 * Order: 字→拼, EN→拼, 字→EN, 拼→EN
 */
export const ALL_PROMPT_TYPES: PromptType[] = [
  'character-to-pinyin',
  'english-to-pinyin',
  'character-to-english',
  'pinyin-to-english'
] as const;

/**
 * Aggregate mastery data for radar chart visualization
 */
export interface AggregateMasteryData {
  byPromptType: Record<PromptType, {
    totalVocabulary: number;
    mastered: number;
    learning: number;
    struggling: number;
    new: number;
    masteryPercentage: number;  // 0-100: weighted score for this prompt type
  }>;
  overallMasteryPercentage: number;  // 0-100: average across all prompt types
}

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
