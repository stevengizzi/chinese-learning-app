import type { SessionSummary } from '../../types/dashboard';
import type { ExerciseType, PlayMode } from '../../types/exercise';

interface SessionDetailModalProps {
  session: SessionSummary;
  onClose: () => void;
}

/**
 * Format exercise type for display
 */
function formatExerciseType(type: ExerciseType): string {
  const labels: Record<ExerciseType, string> = {
    'character-to-pinyin': 'Character → Pinyin',
    'character-to-english': 'Character → English',
    'english-to-pinyin': 'English → Pinyin',
    'pinyin-to-english': 'Pinyin → English',
    'shuffled': 'Shuffled → Pinyin',
    'shuffled-to-english': 'Shuffled → English',
    'audio-to-pinyin': 'Audio → Pinyin',
    'audio-to-english': 'Audio → English',
  };
  return labels[type] || type;
}

/**
 * Format play mode for display
 */
function formatPlayMode(mode: PlayMode): string {
  const labels: Record<PlayMode, string> = {
    'endless': 'Endless Mode',
    'complete-all': 'Complete All',
    'drill': 'Drill Mode',
    'speed-drill': 'Speed Drill'
  };
  return labels[mode] || mode;
}

/**
 * Format time duration
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.round((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

/**
 * Format timestamp to date/time
 */
function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Get accuracy color
 */
function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 90) return 'text-green-600 dark:text-green-400';
  if (accuracy >= 70) return 'text-blue-600 dark:text-blue-400';
  if (accuracy >= 50) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

/**
 * Get play mode color/style
 */
function getPlayModeStyle(mode: PlayMode): string {
  const styles: Record<PlayMode, string> = {
    'endless': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    'complete-all': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    'drill': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    'speed-drill': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
  };
  return styles[mode] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
}

export function SessionDetailModal({ session, onClose }: SessionDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Session Details
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Exercise type and mode badges */}
          <div className="flex items-center gap-2 mt-2">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {formatExerciseType(session.exerciseType)}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded ${getPlayModeStyle(session.playMode)}`}>
              {formatPlayMode(session.playMode)}
            </span>
          </div>

          {/* Time */}
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {formatDateTime(session.startTime)}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Primary Stats */}
          <div className="grid grid-cols-2 gap-4">
            {/* Accuracy */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-center">
              <div className={`text-3xl font-bold ${getAccuracyColor(session.accuracy)}`}>
                {Math.round(session.accuracy)}%
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Accuracy
              </div>
            </div>

            {/* Average Speed */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {formatDuration(session.averageResponseTimeMs)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Avg Response
              </div>
            </div>
          </div>

          {/* Secondary Stats */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Exercises:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {session.correctExercises ?? '?'} / {session.totalExercises}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Duration:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatDuration(session.totalTimeMs ?? (session.endTime - session.startTime))}
                </span>
              </div>

              {session.vocabularyPracticed !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Words Practiced:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {session.vocabularyPracticed}
                  </span>
                </div>
              )}

              {session.fastestResponseMs !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Fastest:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {formatDuration(session.fastestResponseMs)}
                  </span>
                </div>
              )}

              {session.slowestResponseMs !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Slowest:</span>
                  <span className="font-medium text-orange-600 dark:text-orange-400">
                    {formatDuration(session.slowestResponseMs)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Performance Summary */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4">
            <div className="text-center">
              {session.accuracy >= 90 ? (
                <>
                  <div className="text-2xl mb-1">🌟</div>
                  <div className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                    Excellent Performance!
                  </div>
                </>
              ) : session.accuracy >= 70 ? (
                <>
                  <div className="text-2xl mb-1">👍</div>
                  <div className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                    Good work! Keep practicing!
                  </div>
                </>
              ) : (
                <>
                  <div className="text-2xl mb-1">💪</div>
                  <div className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                    Keep going! Practice makes perfect!
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
