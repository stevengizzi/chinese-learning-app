import { useExercise } from '../../contexts/ExerciseContext';
import { useDashboardData } from '../../hooks/useDashboardData';
import { getWeakVocabulary, getAggregateMasteryData } from '../../lib/dashboard/mastery';
import { calculateGlobalAverage } from '../../lib/responseTracking/storage';
import { HeroStats } from './HeroStats';
import { MasteryBreakdown } from './MasteryBreakdown';
import { WeakSpots } from './WeakSpots';
import { ActivityCalendar } from './ActivityCalendar';
import { SpeedTrends } from './SpeedTrends';
import { RecentSessions } from './RecentSessions';
import { HighScoresPanel } from './HighScoresPanel';
import { PromptTypeMasteryBars } from './PromptTypeMasteryBars';
import { MasteryRadarChart } from './MasteryRadarChart';

export function DashboardContent() {
  const { state } = useExercise();

  const {
    stats,
    heroStats,
    masteryBreakdown,
    calendarData,
    speedData,
    isLoading,
    error
  } = useDashboardData(
    state.vocabulary?.active || null,
    state.responseDatabase
  );

  // Get weak vocabulary items for WeakSpots
  const weakItems = state.vocabulary?.active && state.responseDatabase
    ? getWeakVocabulary(state.vocabulary.active, state.responseDatabase, 80)
    : [];

  // Get global average for speed chart
  const globalAverage = state.responseDatabase
    ? calculateGlobalAverage(state.responseDatabase)
    : 2000;

  // Get aggregate mastery data for radar chart and progress bars
  const aggregateMasteryData = state.vocabulary?.active && state.responseDatabase
    ? getAggregateMasteryData(state.vocabulary.active, state.responseDatabase)
    : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <div className="text-gray-600 dark:text-gray-300">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="text-4xl mb-4">:(</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <span className="text-3xl">📊</span>
          Progress Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Track your Mandarin learning journey
        </p>
      </div>

      {/* Hero Stats - Full Width */}
      <div className="mb-6">
        <HeroStats data={heroStats} />
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Wide */}
        <div className="lg:col-span-2 space-y-6">
          {/* Activity Calendar */}
          <ActivityCalendar data={calendarData} weeks={52} />

          {/* Speed Trends */}
          <SpeedTrends data={speedData} globalAverage={globalAverage} />

          {/* Recent Sessions */}
          <RecentSessions sessions={stats.recentSessions} maxItems={10} />
        </div>

        {/* Right Column - Narrow */}
        <div className="space-y-6">
          {/* Mastery Radar Chart */}
          {aggregateMasteryData && (
            <MasteryRadarChart data={aggregateMasteryData} />
          )}

          {/* Prompt Type Mastery Bars */}
          {aggregateMasteryData && (
            <PromptTypeMasteryBars data={aggregateMasteryData} />
          )}

          {/* Mastery Breakdown */}
          <MasteryBreakdown data={masteryBreakdown} />

          {/* Weak Spots */}
          <WeakSpots items={weakItems} maxItems={6} />

          {/* High Scores */}
          <HighScoresPanel maxItems={6} />
        </div>
      </div>

      {/* Footer Stats */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.allTimeStats.totalExercises.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Exercises</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.allTimeStats.totalSessions.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Sessions Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.allTimeStats.totalExercises > 0
                ? Math.round((stats.allTimeStats.totalCorrect / stats.allTimeStats.totalExercises) * 100)
                : 0}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Lifetime Accuracy</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.allTimeStats.totalTimeMs > 0
                ? formatTotalTime(stats.allTimeStats.totalTimeMs)
                : '0m'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Time Practiced</div>
          </div>
        </div>

        {stats.allTimeStats.firstPracticeDate && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Practicing since {formatFirstDate(stats.allTimeStats.firstPracticeDate)}
            </span>
          </div>
        )}
      </div>
    </>
  );
}

/**
 * Format total time in hours and minutes
 */
function formatTotalTime(ms: number): string {
  const totalMinutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }
  return `${hours}h ${minutes}m`;
}

/**
 * Format first practice date
 */
function formatFirstDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}
