import { useMemo, useState } from 'react';
import type { MasteryBreakdown as MasteryBreakdownData, MasteryLevel } from '../../types/dashboard';
import { MASTERY_COLORS, MASTERY_THRESHOLDS } from '../../types/dashboard';

interface MasteryBreakdownProps {
  data: MasteryBreakdownData;
}

interface DonutSegment {
  level: string;
  count: number;
  percentage: number;
  color: string;
}

interface TooltipState {
  visible: boolean;
  level: MasteryLevel | null;
  x: number;
  y: number;
}

/**
 * Get description for each mastery level
 */
function getMasteryDescription(level: MasteryLevel): { title: string; criteria: string[] } {
  const { rollingWindow, mastered, learning } = MASTERY_THRESHOLDS;

  switch (level) {
    case 'mastered':
      return {
        title: 'Mastered',
        criteria: [
          `${mastered.accuracyPercent}% accuracy in last ${rollingWindow} attempts`,
          `Response time within threshold:`,
          `• 1 word: ${(mastered.baseSpeedMs / 1000).toFixed(1)}s`,
          `• 2 words: ${((mastered.baseSpeedMs + mastered.speedPerWordMs) / 1000).toFixed(2)}s`,
          `• +${(mastered.speedPerWordMs / 1000).toFixed(2)}s per additional word`
        ]
      };
    case 'learning':
      return {
        title: 'Learning',
        criteria: [
          `${learning.accuracyPercent}% accuracy in recent attempts`,
          `At least ${learning.minAttempts} total attempts`
        ]
      };
    case 'struggling':
      return {
        title: 'Struggling',
        criteria: [
          `Below ${learning.accuracyPercent}% accuracy`,
          `Has been practiced at least once`
        ]
      };
    case 'new':
      return {
        title: 'New',
        criteria: [
          'Not yet practiced'
        ]
      };
  }
}

/**
 * SVG Donut Chart Component
 */
function DonutChart({ segments, size = 160 }: { segments: DonutSegment[]; size?: number }) {
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Calculate stroke dash arrays and offsets
  let offset = 0;
  const segmentData = segments.map((segment) => {
    const strokeDasharray = (segment.percentage / 100) * circumference;
    const strokeDashoffset = -offset;
    offset += strokeDasharray;
    return {
      ...segment,
      strokeDasharray: `${strokeDasharray} ${circumference}`,
      strokeDashoffset
    };
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="transform -rotate-90"
    >
      {/* Background circle */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-gray-200 dark:text-gray-700"
      />

      {/* Segments */}
      {segmentData.map((segment, index) => (
        <circle
          key={segment.level}
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={segment.color}
          strokeWidth={strokeWidth}
          strokeDasharray={segment.strokeDasharray}
          strokeDashoffset={segment.strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
          style={{
            transitionDelay: `${index * 100}ms`
          }}
        />
      ))}
    </svg>
  );
}

export function MasteryBreakdown({ data }: MasteryBreakdownProps) {
  const { counts } = data;
  const total = counts.total;
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, level: null, x: 0, y: 0 });

  const handleMouseEnter = (e: React.MouseEvent, level: MasteryLevel) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      visible: true,
      level,
      x: rect.left + rect.width / 2,
      y: rect.top - 8
    });
  };

  const handleMouseLeave = () => {
    setTooltip({ visible: false, level: null, x: 0, y: 0 });
  };

  const segments = useMemo<DonutSegment[]>(() => {
    if (total === 0) return [];

    return [
      {
        level: 'mastered',
        count: counts.mastered,
        percentage: (counts.mastered / total) * 100,
        color: MASTERY_COLORS.mastered
      },
      {
        level: 'learning',
        count: counts.learning,
        percentage: (counts.learning / total) * 100,
        color: MASTERY_COLORS.learning
      },
      {
        level: 'struggling',
        count: counts.struggling,
        percentage: (counts.struggling / total) * 100,
        color: MASTERY_COLORS.struggling
      },
      {
        level: 'new',
        count: counts.new,
        percentage: (counts.new / total) * 100,
        color: MASTERY_COLORS.new
      }
    ].filter(s => s.count > 0);
  }, [counts, total]);

  const masteryPercentage = total > 0 ? Math.round((counts.mastered / total) * 100) : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <span>🎯</span>
        Vocabulary Mastery
      </h2>

      {total === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No vocabulary loaded yet.</p>
          <p className="text-sm mt-1">Load vocabulary to see mastery breakdown.</p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          {/* Donut Chart with center text */}
          <div className="relative">
            <DonutChart segments={segments} size={160} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {masteryPercentage}%
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Mastered
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 w-full space-y-2">
            <div
              className="flex items-center justify-between cursor-help rounded-md px-1 -mx-1 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              onMouseEnter={(e) => handleMouseEnter(e, 'mastered')}
              onMouseLeave={handleMouseLeave}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: MASTERY_COLORS.mastered }}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Mastered</span>
                <span className="text-gray-400 text-xs">ⓘ</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {counts.mastered}
              </span>
            </div>

            <div
              className="flex items-center justify-between cursor-help rounded-md px-1 -mx-1 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              onMouseEnter={(e) => handleMouseEnter(e, 'learning')}
              onMouseLeave={handleMouseLeave}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: MASTERY_COLORS.learning }}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Learning</span>
                <span className="text-gray-400 text-xs">ⓘ</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {counts.learning}
              </span>
            </div>

            <div
              className="flex items-center justify-between cursor-help rounded-md px-1 -mx-1 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              onMouseEnter={(e) => handleMouseEnter(e, 'struggling')}
              onMouseLeave={handleMouseLeave}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: MASTERY_COLORS.struggling }}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Struggling</span>
                <span className="text-gray-400 text-xs">ⓘ</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {counts.struggling}
              </span>
            </div>

            <div
              className="flex items-center justify-between cursor-help rounded-md px-1 -mx-1 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              onMouseEnter={(e) => handleMouseEnter(e, 'new')}
              onMouseLeave={handleMouseLeave}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: MASTERY_COLORS.new }}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">New</span>
                <span className="text-gray-400 text-xs">ⓘ</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {counts.new}
              </span>
            </div>
          </div>

          {/* Total */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 w-full">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Vocabulary
              </span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {total}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Mastery level tooltip */}
      {tooltip.visible && tooltip.level && (
        <div
          className="fixed z-50 px-4 py-3 text-sm bg-gray-900 dark:bg-gray-700 text-white rounded-lg shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full max-w-xs"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {(() => {
            const desc = getMasteryDescription(tooltip.level);
            return (
              <>
                <div className="font-semibold mb-1" style={{ color: MASTERY_COLORS[tooltip.level] }}>
                  {desc.title}
                </div>
                <ul className="text-xs text-gray-300 space-y-0.5">
                  {desc.criteria.map((criterion, i) => (
                    <li key={i}>{criterion}</li>
                  ))}
                </ul>
              </>
            );
          })()}
          <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full">
            <div className="border-8 border-transparent border-t-gray-900 dark:border-t-gray-700" />
          </div>
        </div>
      )}
    </div>
  );
}
