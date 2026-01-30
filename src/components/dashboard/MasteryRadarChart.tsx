import { useMemo } from 'react';
import type { AggregateMasteryData } from '../../types/dashboard';
import { ALL_PROMPT_TYPES, PROMPT_TYPE_CONFIG } from '../../types/dashboard';

interface MasteryRadarChartProps {
  data: AggregateMasteryData;
  size?: number;
}

/**
 * Radar/Spider chart showing mastery across all prompt types
 * Outer bounds = 100% mastery, filled area = actual mastery
 */
export function MasteryRadarChart({ data, size = 300 }: MasteryRadarChartProps) {
  const center = size / 2;
  const maxRadius = (size - 80) / 2; // Leave space for labels
  const numAxes = ALL_PROMPT_TYPES.length;
  const angleStep = (2 * Math.PI) / numAxes;
  const startAngle = -Math.PI / 2; // Start from top

  // Calculate points for the radar polygon
  const radarPoints = useMemo(() => {
    return ALL_PROMPT_TYPES.map((pt, i) => {
      const angle = startAngle + i * angleStep;
      const percentage = data.byPromptType[pt].masteryPercentage / 100;
      const radius = maxRadius * percentage;
      return {
        x: center + radius * Math.cos(angle),
        y: center + radius * Math.sin(angle),
        percentage: data.byPromptType[pt].masteryPercentage,
        config: PROMPT_TYPE_CONFIG[pt],
        angle
      };
    });
  }, [data, center, maxRadius, angleStep, startAngle]);

  // Create SVG path for the filled area
  const radarPath = useMemo(() => {
    if (radarPoints.length === 0) return '';
    const points = radarPoints.map(p => `${p.x},${p.y}`).join(' L ');
    return `M ${points} Z`;
  }, [radarPoints]);

  // Calculate axis endpoints (100% marks)
  const axisEndpoints = useMemo(() => {
    return ALL_PROMPT_TYPES.map((pt, i) => {
      const angle = startAngle + i * angleStep;
      return {
        x: center + maxRadius * Math.cos(angle),
        y: center + maxRadius * Math.sin(angle),
        labelX: center + (maxRadius + 24) * Math.cos(angle),
        labelY: center + (maxRadius + 24) * Math.sin(angle),
        config: PROMPT_TYPE_CONFIG[pt]
      };
    });
  }, [center, maxRadius, angleStep, startAngle]);

  // Concentric rings for grid (25%, 50%, 75%, 100%)
  const gridRings = [0.25, 0.5, 0.75, 1].map(pct => ({
    radius: maxRadius * pct,
    percentage: pct * 100
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <span>🎯</span>
        Overall Mastery
      </h2>

      <div className="flex flex-col items-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible"
        >
          {/* Definitions for gradients and filters */}
          <defs>
            {/* Gradient for filled area */}
            <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#EC4899" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.8" />
            </linearGradient>

            {/* Glow filter for the filled area */}
            <filter id="radarGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Pulse animation */}
            <style>
              {`
                @keyframes radarPulse {
                  0%, 100% { opacity: 0.7; transform-origin: center; transform: scale(1); }
                  50% { opacity: 0.9; transform-origin: center; transform: scale(1.02); }
                }
                .radar-fill {
                  animation: radarPulse 3s ease-in-out infinite;
                }
              `}
            </style>
          </defs>

          {/* Background grid rings */}
          {gridRings.map((ring, i) => (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={ring.radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray={i === gridRings.length - 1 ? "none" : "4,4"}
              className="text-gray-200 dark:text-gray-700"
            />
          ))}

          {/* Axis lines */}
          {axisEndpoints.map((endpoint, i) => (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={endpoint.x}
              y2={endpoint.y}
              stroke="currentColor"
              strokeWidth="1"
              className="text-gray-300 dark:text-gray-600"
            />
          ))}

          {/* Filled radar area with pulse animation */}
          <path
            d={radarPath}
            fill="url(#radarGradient)"
            stroke="url(#radarGradient)"
            strokeWidth="2"
            filter="url(#radarGlow)"
            className="radar-fill transition-all duration-700"
          />

          {/* Data points */}
          {radarPoints.map((point, i) => (
            <circle
              key={i}
              cx={point.x}
              cy={point.y}
              r="6"
              fill={point.config.color}
              stroke="white"
              strokeWidth="2"
              className="transition-all duration-500"
              style={{ transitionDelay: `${i * 100}ms` }}
            />
          ))}

          {/* Axis labels */}
          {axisEndpoints.map((endpoint, i) => {
            const pt = ALL_PROMPT_TYPES[i];
            const percentage = data.byPromptType[pt].masteryPercentage;

            return (
              <g key={i}>
                <text
                  x={endpoint.labelX}
                  y={endpoint.labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs font-medium fill-current"
                  style={{ fill: endpoint.config.color }}
                >
                  {endpoint.config.shortLabel}
                </text>
                <text
                  x={endpoint.labelX}
                  y={endpoint.labelY + 14}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-[10px] fill-gray-500 dark:fill-gray-400"
                >
                  {Math.round(percentage)}%
                </text>
              </g>
            );
          })}

          {/* Center percentage */}
          <text
            x={center}
            y={center - 8}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-2xl font-bold fill-gray-900 dark:fill-white"
          >
            {Math.round(data.overallMasteryPercentage)}%
          </text>
          <text
            x={center}
            y={center + 12}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs fill-gray-500 dark:fill-gray-400"
          >
            Overall
          </text>
        </svg>

        {/* Mastery level description */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {data.overallMasteryPercentage >= 80 ? (
              <span className="text-green-600 dark:text-green-400 font-medium">Excellent progress! Keep it up!</span>
            ) : data.overallMasteryPercentage >= 50 ? (
              <span className="text-blue-600 dark:text-blue-400 font-medium">Good progress! You're getting there!</span>
            ) : data.overallMasteryPercentage >= 20 ? (
              <span className="text-yellow-600 dark:text-yellow-400 font-medium">Making progress. Keep practicing!</span>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">Start practicing to build mastery!</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
