import { useMemo } from 'react';
import type { AggregateMasteryData } from '../../types/dashboard';
import { ALL_PROMPT_TYPES, PROMPT_TYPE_CONFIG, MASTERY_COLORS } from '../../types/dashboard';

interface PromptTypeMasteryBarsProps {
  data: AggregateMasteryData;
}

/**
 * Stacked progress bars showing mastery breakdown for each prompt type
 */
export function PromptTypeMasteryBars({ data }: PromptTypeMasteryBarsProps) {
  const bars = useMemo(() => {
    return ALL_PROMPT_TYPES.map(pt => {
      const stats = data.byPromptType[pt];
      const config = PROMPT_TYPE_CONFIG[pt];
      const total = stats.totalVocabulary;

      if (total === 0) {
        return {
          promptType: pt,
          config,
          segments: [],
          masteryPercentage: 0
        };
      }

      // Calculate percentages for each segment
      const segments = [
        { level: 'mastered' as const, count: stats.mastered, percentage: (stats.mastered / total) * 100, color: MASTERY_COLORS.mastered },
        { level: 'learning' as const, count: stats.learning, percentage: (stats.learning / total) * 100, color: MASTERY_COLORS.learning },
        { level: 'struggling' as const, count: stats.struggling, percentage: (stats.struggling / total) * 100, color: MASTERY_COLORS.struggling },
        { level: 'new' as const, count: stats.new, percentage: (stats.new / total) * 100, color: MASTERY_COLORS.new }
      ].filter(s => s.count > 0);

      return {
        promptType: pt,
        config,
        segments,
        masteryPercentage: stats.masteryPercentage,
        stats
      };
    });
  }, [data]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <span>📊</span>
        Skill Mastery
      </h2>

      <div className="space-y-4">
        {bars.map(bar => (
          <div key={bar.promptType} className="space-y-1">
            {/* Label row */}
            <div className="flex items-center justify-between text-sm">
              <span
                className="font-medium"
                style={{ color: bar.config.color }}
              >
                {bar.config.label}
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                {Math.round(bar.masteryPercentage)}%
              </span>
            </div>

            {/* Stacked bar */}
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
              {bar.segments.map((segment, idx) => (
                <div
                  key={segment.level}
                  className="h-full transition-all duration-500 ease-out first:rounded-l-full last:rounded-r-full"
                  style={{
                    width: `${segment.percentage}%`,
                    backgroundColor: segment.color,
                    transitionDelay: `${idx * 100}ms`
                  }}
                  title={`${segment.level}: ${segment.count} (${Math.round(segment.percentage)}%)`}
                />
              ))}
            </div>

            {/* Stats row */}
            {bar.stats && (
              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: MASTERY_COLORS.mastered }} />
                  {bar.stats.mastered}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: MASTERY_COLORS.learning }} />
                  {bar.stats.learning}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: MASTERY_COLORS.struggling }} />
                  {bar.stats.struggling}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: MASTERY_COLORS.new }} />
                  {bar.stats.new}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center gap-4 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: MASTERY_COLORS.mastered }} />
            <span className="text-gray-600 dark:text-gray-400">Mastered</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: MASTERY_COLORS.learning }} />
            <span className="text-gray-600 dark:text-gray-400">Learning</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: MASTERY_COLORS.struggling }} />
            <span className="text-gray-600 dark:text-gray-400">Struggling</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: MASTERY_COLORS.new }} />
            <span className="text-gray-600 dark:text-gray-400">New</span>
          </span>
        </div>
      </div>
    </div>
  );
}
