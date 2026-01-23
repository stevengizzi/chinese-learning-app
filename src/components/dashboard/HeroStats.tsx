import { useEffect, useState } from 'react';
import type { HeroStatsData } from '../../types/dashboard';
import { getStreakMessage } from '../../lib/dashboard/streaks';

interface HeroStatsProps {
  data: HeroStatsData;
}

/**
 * Animated counter component
 */
function AnimatedNumber({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const startValue = displayValue;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (value - startValue) * eased);

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <>{displayValue}</>;
}

export function HeroStats({ data }: HeroStatsProps) {
  const {
    currentStreak,
    longestStreak,
    isStreakActive,
    wordsMastered,
    totalWords,
    overallAccuracy,
    totalExercises
  } = data;

  const streakMessage = getStreakMessage(currentStreak, isStreakActive);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Streak Card */}
        <div
          className={`relative overflow-hidden rounded-xl p-6 text-center transition-all duration-300 hover:scale-[1.02] ${
            isStreakActive && currentStreak > 0
              ? 'bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/40 dark:to-red-900/40 border-2 border-orange-300 dark:border-orange-600'
              : 'bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600'
          }`}
        >
          {/* Glow effect for active streak */}
          {isStreakActive && currentStreak > 0 && (
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-red-400/20 animate-pulse" />
          )}

          <div className="relative">
            <div className={`text-4xl mb-2 ${isStreakActive && currentStreak > 0 ? 'animate-bounce' : ''}`}>
              🔥
            </div>
            <div className={`text-5xl font-bold ${
              isStreakActive && currentStreak > 0
                ? 'text-orange-600 dark:text-orange-400'
                : 'text-gray-400 dark:text-gray-500'
            }`}>
              <AnimatedNumber value={currentStreak} />
            </div>
            <div className={`text-sm font-medium mt-1 ${
              isStreakActive && currentStreak > 0
                ? 'text-orange-700 dark:text-orange-300'
                : 'text-gray-500 dark:text-gray-400'
            }`}>
              Day Streak
            </div>
            <div className={`text-xs mt-2 ${
              isStreakActive && currentStreak > 0
                ? 'text-orange-600/80 dark:text-orange-400/80'
                : 'text-gray-400 dark:text-gray-500'
            }`}>
              {streakMessage}
            </div>
            {longestStreak > currentStreak && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Best: {longestStreak} days
              </div>
            )}
          </div>
        </div>

        {/* Words Mastered Card */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border-2 border-green-200 dark:border-green-700 rounded-xl p-6 text-center transition-all duration-300 hover:scale-[1.02]">
          <div className="text-4xl mb-2">✓</div>
          <div className="text-5xl font-bold text-green-600 dark:text-green-400">
            <AnimatedNumber value={wordsMastered} />
          </div>
          <div className="text-sm font-medium text-green-700 dark:text-green-300 mt-1">
            Words Mastered
          </div>
          <div className="text-xs text-green-600/80 dark:text-green-400/80 mt-2">
            {totalWords > 0 ? `${Math.round((wordsMastered / totalWords) * 100)}% of ${totalWords} words` : 'Load vocabulary to track'}
          </div>
        </div>

        {/* Overall Accuracy Card */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-6 text-center transition-all duration-300 hover:scale-[1.02]">
          <div className="text-4xl mb-2">📊</div>
          <div className="text-5xl font-bold text-blue-600 dark:text-blue-400">
            <AnimatedNumber value={Math.round(overallAccuracy)} />
            <span className="text-3xl">%</span>
          </div>
          <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mt-1">
            Overall Accuracy
          </div>
          <div className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-2">
            {totalExercises > 0 ? `From ${totalExercises.toLocaleString()} exercises` : 'Start practicing to track'}
          </div>
        </div>
      </div>
    </div>
  );
}
