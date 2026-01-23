import type { DashboardStats, CalendarDay } from '../../types/dashboard';
import { INTENSITY_THRESHOLDS } from '../../types/dashboard';

/**
 * Format a date as local YYYY-MM-DD string
 */
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get intensity level (0-4) based on exercise count
 */
export function getIntensityLevel(exercises: number): 0 | 1 | 2 | 3 | 4 {
  if (exercises === 0) return 0;
  if (exercises < INTENSITY_THRESHOLDS.level2) return 1;
  if (exercises < INTENSITY_THRESHOLDS.level3) return 2;
  if (exercises < INTENSITY_THRESHOLDS.level4) return 3;
  return 4;
}

/**
 * Generate calendar data for the past N weeks
 * Returns a 2D array: weeks[weekIndex][dayIndex]
 * Day 0 = Sunday, Day 6 = Saturday
 */
export function generateCalendarData(
  stats: DashboardStats,
  weeks: number = 52
): CalendarDay[][] {
  const calendar: CalendarDay[][] = [];
  const today = new Date();
  const todayStr = formatLocalDate(today);

  // Start from the Sunday of (weeks) weeks ago
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (weeks * 7) - today.getDay());

  for (let week = 0; week < weeks; week++) {
    const weekData: CalendarDay[] = [];

    for (let day = 0; day < 7; day++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + (week * 7) + day);
      const dateStr = formatLocalDate(date);

      const activity = stats.dailyActivity[dateStr];
      const exercises = activity?.totalExercises || 0;
      const isFuture = date > today;
      const isToday = dateStr === todayStr;

      weekData.push({
        date: dateStr,
        intensity: isFuture ? 0 : getIntensityLevel(exercises),
        exercises,
        isToday,
        isFuture
      });
    }

    calendar.push(weekData);
  }

  return calendar;
}

/**
 * Get activity summary for a date
 */
export function getActivitySummary(
  stats: DashboardStats,
  date: string
): { exercises: number; sessions: number; accuracy: number } | null {
  const activity = stats.dailyActivity[date];

  if (!activity) {
    return null;
  }

  const accuracy = activity.totalExercises > 0
    ? (activity.totalCorrect / activity.totalExercises) * 100
    : 0;

  return {
    exercises: activity.totalExercises,
    sessions: activity.sessionsCompleted,
    accuracy
  };
}

/**
 * Format date for tooltip display
 */
export function formatCalendarDate(dateStr: string): string {
  // Parse YYYY-MM-DD as local date (not UTC)
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Get tooltip text for a calendar day
 */
export function getCalendarTooltip(day: CalendarDay): string {
  if (day.isFuture) {
    return formatCalendarDate(day.date);
  }

  const dateFormatted = formatCalendarDate(day.date);

  if (day.exercises === 0) {
    return `${dateFormatted}: No activity`;
  }

  const exerciseText = day.exercises === 1 ? 'exercise' : 'exercises';
  return `${dateFormatted}: ${day.exercises} ${exerciseText}`;
}

/**
 * Get the month labels for the calendar header
 * Returns array of { month: string, startWeek: number }
 */
export function getMonthLabels(weeks: number = 52): Array<{ month: string; startWeek: number }> {
  const labels: Array<{ month: string; startWeek: number }> = [];
  const today = new Date();

  // Start from the Sunday of (weeks) weeks ago
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (weeks * 7) - today.getDay());

  let currentMonth = -1;

  for (let week = 0; week < weeks; week++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + (week * 7));
    const month = date.getMonth();

    if (month !== currentMonth) {
      currentMonth = month;
      labels.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        startWeek: week
      });
    }
  }

  return labels;
}

/**
 * Get day labels for the calendar (S, M, T, W, T, F, S)
 */
export function getDayLabels(): string[] {
  return ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
}

/**
 * Calculate total activity for a time period
 */
export function getActivityForPeriod(
  stats: DashboardStats,
  days: number
): { totalExercises: number; totalSessions: number; daysActive: number } {
  const today = new Date();
  let totalExercises = 0;
  let totalSessions = 0;
  let daysActive = 0;

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = formatLocalDate(date);

    const activity = stats.dailyActivity[dateStr];
    if (activity && activity.totalExercises > 0) {
      totalExercises += activity.totalExercises;
      totalSessions += activity.sessionsCompleted;
      daysActive += 1;
    }
  }

  return { totalExercises, totalSessions, daysActive };
}
