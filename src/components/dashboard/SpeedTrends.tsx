import { useMemo } from 'react';
import type { SpeedDataPoint } from '../../types/dashboard';

interface SpeedTrendsProps {
  data: SpeedDataPoint[];
  globalAverage: number;
}

/**
 * Format milliseconds to readable time
 */
function formatMs(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function SpeedTrends({ data, globalAverage }: SpeedTrendsProps) {
  // Chart dimensions
  const width = 400;
  const height = 150;
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate chart data
  const chartData = useMemo(() => {
    if (data.length === 0) return null;

    // Get min/max for Y axis
    const values = data.map(d => d.averageMs).filter(v => v > 0);
    if (values.length === 0) return null;

    const minY = Math.min(...values, globalAverage) * 0.8;
    const maxY = Math.max(...values, globalAverage) * 1.2;

    // Scale functions
    const xScale = (index: number) => (index / (data.length - 1)) * chartWidth;
    const yScale = (value: number) => chartHeight - ((value - minY) / (maxY - minY)) * chartHeight;

    // Generate path
    const validPoints = data
      .map((d, i) => ({ x: xScale(i), y: yScale(d.averageMs), valid: d.averageMs > 0 }))
      .filter(p => p.valid);

    if (validPoints.length < 2) return null;

    const pathD = validPoints
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ');

    // Benchmark line Y position
    const benchmarkY = yScale(globalAverage);

    // Calculate trend (comparing first half to second half)
    const midpoint = Math.floor(validPoints.length / 2);
    const firstHalfAvg = validPoints.slice(0, midpoint).reduce((sum, p) => sum + (chartHeight - p.y), 0) / midpoint;
    const secondHalfAvg = validPoints.slice(midpoint).reduce((sum, p) => sum + (chartHeight - p.y), 0) / (validPoints.length - midpoint);
    const isImproving = secondHalfAvg > firstHalfAvg; // Lower Y = faster = better

    return {
      pathD,
      benchmarkY,
      minY,
      maxY,
      validPoints,
      isImproving
    };
  }, [data, globalAverage, chartWidth, chartHeight]);

  // Get recent stats
  const recentData = data.slice(-7).filter(d => d.averageMs > 0);
  const recentAverage = recentData.length > 0
    ? recentData.reduce((sum, d) => sum + d.averageMs, 0) / recentData.length
    : 0;

  const improvement = globalAverage > 0 && recentAverage > 0
    ? ((globalAverage - recentAverage) / globalAverage) * 100
    : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span>📈</span>
          Speed Trends
        </h2>
        {chartData && (
          <div className={`text-sm font-medium flex items-center gap-1 ${
            chartData.isImproving ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'
          }`}>
            {chartData.isImproving ? '↑' : '↓'}
            {chartData.isImproving ? 'Improving' : 'Slowing'}
          </div>
        )}
      </div>

      {!chartData ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>Not enough data yet.</p>
          <p className="text-sm mt-1">Practice more to see your speed trends.</p>
        </div>
      ) : (
        <>
          {/* SVG Chart */}
          <div className="overflow-hidden">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Y-axis labels */}
              <text
                x={padding.left - 8}
                y={padding.top}
                className="text-[10px] fill-gray-400 dark:fill-gray-500"
                textAnchor="end"
                dominantBaseline="middle"
              >
                {formatMs(chartData.maxY)}
              </text>
              <text
                x={padding.left - 8}
                y={height - padding.bottom}
                className="text-[10px] fill-gray-400 dark:fill-gray-500"
                textAnchor="end"
                dominantBaseline="middle"
              >
                {formatMs(chartData.minY)}
              </text>

              {/* Chart area */}
              <g transform={`translate(${padding.left}, ${padding.top})`}>
                {/* Grid lines */}
                <line
                  x1={0}
                  y1={0}
                  x2={chartWidth}
                  y2={0}
                  className="stroke-gray-200 dark:stroke-gray-700"
                  strokeDasharray="4"
                />
                <line
                  x1={0}
                  y1={chartHeight / 2}
                  x2={chartWidth}
                  y2={chartHeight / 2}
                  className="stroke-gray-200 dark:stroke-gray-700"
                  strokeDasharray="4"
                />
                <line
                  x1={0}
                  y1={chartHeight}
                  x2={chartWidth}
                  y2={chartHeight}
                  className="stroke-gray-200 dark:stroke-gray-700"
                  strokeDasharray="4"
                />

                {/* Benchmark line (global average) */}
                <line
                  x1={0}
                  y1={chartData.benchmarkY}
                  x2={chartWidth}
                  y2={chartData.benchmarkY}
                  stroke="#3B82F6"
                  strokeWidth={1.5}
                  strokeDasharray="6,4"
                  opacity={0.6}
                />

                {/* Data line */}
                <path
                  d={chartData.pathD}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data points */}
                {chartData.validPoints.map((point, i) => (
                  <circle
                    key={i}
                    cx={point.x}
                    cy={point.y}
                    r={3}
                    fill="#10B981"
                    className="transition-all hover:r-5"
                  />
                ))}
              </g>
            </svg>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-green-500 rounded" />
              <span className="text-gray-600 dark:text-gray-400">Your speed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-blue-500 rounded opacity-60" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #3B82F6, #3B82F6 6px, transparent 6px, transparent 10px)' }} />
              <span className="text-gray-600 dark:text-gray-400">Global avg ({formatMs(globalAverage)})</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {formatMs(recentAverage)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Recent avg (7 days)
              </div>
            </div>
            <div className="text-center">
              <div className={`text-lg font-bold ${
                improvement > 0 ? 'text-green-600 dark:text-green-400' :
                improvement < 0 ? 'text-orange-600 dark:text-orange-400' :
                'text-gray-600 dark:text-gray-400'
              }`}>
                {improvement > 0 ? '+' : ''}{improvement.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                vs global average
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
