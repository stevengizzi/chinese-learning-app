import { useEffect, useState } from 'react';
import { loadResponseDatabase, calculateGlobalAverage } from '../lib/responseTracking/storage';
import {
  getSpeedPerformance,
  getPerformanceColor,
  getPerformanceMessage,
  formatResponseTime
} from '../lib/responseTracking/analytics';

interface SpeedFeedbackProps {
  responseTimeMs: number;
  wasCorrect: boolean;
}

export function SpeedFeedback({ responseTimeMs, wasCorrect }: SpeedFeedbackProps) {
  const [globalAverage, setGlobalAverage] = useState(2000);

  useEffect(() => {
    loadResponseDatabase().then(db => {
      setGlobalAverage(calculateGlobalAverage(db));
    });
  }, []);

  if (!wasCorrect) {
    return null; // Only show speed feedback for correct answers
  }

  const performance = getSpeedPerformance(responseTimeMs, globalAverage);
  const colorClass = getPerformanceColor(performance);
  const message = getPerformanceMessage(performance);

  return (
    <div className={`mt-4 p-4 rounded-lg border-2 ${
      performance === 'excellent' ? 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700' :
      performance === 'good' ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700' :
      performance === 'average' ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700' :
      performance === 'slow' ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700' :
      'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700'
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <div className={`text-lg font-semibold ${colorClass}`}>
            {message}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Response time: {formatResponseTime(responseTimeMs)}
          </div>
        </div>
        <div className="text-right text-sm text-gray-500 dark:text-gray-400">
          <div>Average: {formatResponseTime(globalAverage)}</div>
          <div className={colorClass}>
            {responseTimeMs < globalAverage ? '↓ Faster' : '↑ Slower'}
          </div>
        </div>
      </div>
    </div>
  );
}
