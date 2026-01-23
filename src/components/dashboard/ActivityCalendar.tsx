import { useMemo, useState } from 'react';
import type { CalendarDay } from '../../types/dashboard';
import { INTENSITY_COLORS } from '../../types/dashboard';
import { getMonthLabels, getDayLabels, formatCalendarDate } from '../../lib/dashboard/calendar';

interface ActivityCalendarProps {
  data: CalendarDay[][];
  weeks?: number;
}

interface TooltipState {
  visible: boolean;
  day: CalendarDay | null;
  x: number;
  y: number;
}

export function ActivityCalendar({ data, weeks = 52 }: ActivityCalendarProps) {
  const monthLabels = useMemo(() => getMonthLabels(weeks), [weeks]);
  const dayLabels = getDayLabels();
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, day: null, x: 0, y: 0 });

  // Calculate total exercises in the period
  const totalExercises = useMemo(() => {
    return data.flat().reduce((sum, day) => sum + day.exercises, 0);
  }, [data]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span>📅</span>
          Activity
        </h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {totalExercises.toLocaleString()} exercises in {weeks} weeks
        </span>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Month labels */}
          <div className="flex mb-1 ml-8">
            {monthLabels.map((label, index) => (
              <div
                key={`${label.month}-${index}`}
                className="text-xs text-gray-500 dark:text-gray-400"
                style={{
                  position: 'relative',
                  left: `${label.startWeek * 13}px`
                }}
              >
                {label.month}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="flex gap-[2px]">
            {/* Day labels */}
            <div className="flex flex-col gap-[2px] mr-1">
              {dayLabels.map((label, index) => (
                <div
                  key={index}
                  className="w-6 h-[11px] text-[9px] text-gray-400 dark:text-gray-500 flex items-center"
                >
                  {index % 2 === 1 ? label : ''}
                </div>
              ))}
            </div>

            {/* Weeks */}
            {data.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-[2px]">
                {week.map((day, dayIndex) => (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    className={`w-[11px] h-[11px] rounded-sm cursor-pointer transition-all ${
                      day.isFuture
                        ? 'bg-gray-50 dark:bg-gray-800'
                        : INTENSITY_COLORS[day.intensity]
                    } ${
                      day.isToday
                        ? 'ring-2 ring-blue-500 dark:ring-blue-400'
                        : ''
                    } hover:ring-2 hover:ring-gray-400 dark:hover:ring-gray-500`}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltip({
                        visible: true,
                        day,
                        x: rect.left + rect.width / 2,
                        y: rect.top - 8
                      });
                    }}
                    onMouseLeave={() => setTooltip({ visible: false, day: null, x: 0, y: 0 })}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-4 text-xs text-gray-500 dark:text-gray-400">
        <span>Less</span>
        <div className={`w-[11px] h-[11px] rounded-sm ${INTENSITY_COLORS[0]}`} />
        <div className={`w-[11px] h-[11px] rounded-sm ${INTENSITY_COLORS[1]}`} />
        <div className={`w-[11px] h-[11px] rounded-sm ${INTENSITY_COLORS[2]}`} />
        <div className={`w-[11px] h-[11px] rounded-sm ${INTENSITY_COLORS[3]}`} />
        <div className={`w-[11px] h-[11px] rounded-sm ${INTENSITY_COLORS[4]}`} />
        <span>More</span>
      </div>

      {/* Custom tooltip */}
      {tooltip.visible && tooltip.day && (
        <div
          className="fixed z-50 px-3 py-2 text-sm bg-gray-900 dark:bg-gray-700 text-white rounded-lg shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="font-medium">{formatCalendarDate(tooltip.day.date)}</div>
          {tooltip.day.isFuture ? (
            <div className="text-gray-400">Future</div>
          ) : tooltip.day.exercises === 0 ? (
            <div className="text-gray-400">No activity</div>
          ) : (
            <div className="text-green-400">
              {tooltip.day.exercises} {tooltip.day.exercises === 1 ? 'exercise' : 'exercises'}
            </div>
          )}
          <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full">
            <div className="border-8 border-transparent border-t-gray-900 dark:border-t-gray-700" />
          </div>
        </div>
      )}
    </div>
  );
}
