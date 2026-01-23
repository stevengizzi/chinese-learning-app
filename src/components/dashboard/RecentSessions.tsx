import { useState } from 'react';
import type { SessionSummary } from '../../types/dashboard';
import type { ExerciseType, PlayMode } from '../../types/exercise';
import { SessionDetailModal } from './SessionDetailModal';

interface RecentSessionsProps {
  sessions: SessionSummary[];
  maxItems?: number;
}

/**
 * Format exercise type for display
 */
function formatExerciseType(type: ExerciseType): string {
  const labels: Record<ExerciseType, string> = {
    'character-to-pinyin': 'Char → Pinyin',
    'character-to-english': 'Char → English',
    'english-to-pinyin': 'Eng → Pinyin',
    'pinyin-to-english': 'Pinyin → Eng',
    'shuffled': 'Shuffled → Pinyin',
    'shuffled-to-english': 'Shuffled → Eng'
  };
  return labels[type] || type;
}

/**
 * Format play mode for display
 */
function formatPlayMode(mode: PlayMode): string {
  const labels: Record<PlayMode, string> = {
    'endless': 'Endless',
    'complete-all': 'Complete All',
    'drill': 'Drill',
    'speed-drill': 'Speed Drill'
  };
  return labels[mode] || mode;
}

/**
 * Format relative time
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

/**
 * Format response time
 */
function formatResponseTime(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
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

export function RecentSessions({ sessions, maxItems = 10 }: RecentSessionsProps) {
  const displaySessions = sessions.slice(0, maxItems);
  const [selectedSession, setSelectedSession] = useState<SessionSummary | null>(null);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <span>📋</span>
        Recent Sessions
      </h2>

      {displaySessions.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No sessions yet.</p>
          <p className="text-sm mt-1">Complete a practice session to see it here.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {displaySessions.map((session) => (
            <div
              key={session.id}
              onClick={() => setSelectedSession(session)}
              className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900 dark:text-white text-sm">
                      {formatExerciseType(session.exerciseType)}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${getPlayModeStyle(session.playMode)}`}>
                      {formatPlayMode(session.playMode)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatRelativeTime(session.startTime)} • {session.totalExercises} exercises
                    {session.averageResponseTimeMs > 0 && (
                      <> • {formatResponseTime(session.averageResponseTimeMs)} avg</>
                    )}
                  </div>
                </div>

                <div className="text-right ml-3 flex items-center gap-2">
                  <div className={`text-lg font-bold ${getAccuracyColor(session.accuracy)}`}>
                    {Math.round(session.accuracy)}%
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {sessions.length > maxItems && (
        <div className="text-center pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Showing {maxItems} of {sessions.length} sessions
          </span>
        </div>
      )}

      {/* Session detail modal */}
      {selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  );
}
