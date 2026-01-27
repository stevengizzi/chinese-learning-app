import { getAllHighScores, formatTime, formatDate, type HighScore } from '../../lib/highScores';
import type { ExerciseType, PlayMode } from '../../types/exercise';

interface HighScoresPanelProps {
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
    'shuffled-to-english': 'Shuffled → Eng',
    'audio-to-pinyin': 'Audio → Pinyin',
    'audio-to-english': 'Audio → Eng',
  };
  return labels[type] || type;
}

/**
 * Format play mode for display (short version)
 */
function formatPlayModeShort(mode: PlayMode): string {
  const labels: Record<PlayMode, string> = {
    'endless': 'End',
    'complete-all': 'All',
    'drill': 'Drill',
    'speed-drill': 'Speed'
  };
  return labels[mode] || mode;
}

/**
 * Get color for play mode badge
 */
function getPlayModeColor(mode: PlayMode): string {
  const colors: Record<PlayMode, string> = {
    'endless': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    'complete-all': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    'drill': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    'speed-drill': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
  };
  return colors[mode] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
}

interface ParsedHighScore extends HighScore {
  exerciseType: ExerciseType;
  playMode: PlayMode;
  key: string;
}

/**
 * Parse high scores into sorted array
 */
function parseHighScores(scores: Record<string, HighScore>): ParsedHighScore[] {
  const parsed: ParsedHighScore[] = [];

  for (const [key, score] of Object.entries(scores)) {
    // Reconstruct the key properly for compound exercise types
    const parts = key.split('-');
    const actualPlayMode = parts[parts.length - 1] as PlayMode;
    const actualExerciseType = parts.slice(0, -1).join('-') as ExerciseType;

    parsed.push({
      ...score,
      exerciseType: actualExerciseType,
      playMode: actualPlayMode,
      key
    });
  }

  // Sort by average time (fastest first)
  return parsed.sort((a, b) => a.averageTimePerCorrectAnswer - b.averageTimePerCorrectAnswer);
}

export function HighScoresPanel({ maxItems = 8 }: HighScoresPanelProps) {
  const allScores = getAllHighScores();
  const parsedScores = parseHighScores(allScores).slice(0, maxItems);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <span>🏆</span>
        Personal Bests
      </h2>

      {parsedScores.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No high scores yet.</p>
          <p className="text-sm mt-1">Complete practice sessions to set records!</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {parsedScores.map((score, index) => (
            <div
              key={score.key}
              className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                {/* Rank */}
                <div className="flex-shrink-0 w-6 text-center">
                  {index === 0 ? (
                    <span className="text-yellow-500 text-lg">🥇</span>
                  ) : index === 1 ? (
                    <span className="text-gray-400 text-lg">🥈</span>
                  ) : index === 2 ? (
                    <span className="text-amber-600 text-lg">🥉</span>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500 text-sm font-medium">
                      {index + 1}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900 dark:text-white text-sm">
                      {formatExerciseType(score.exerciseType)}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${getPlayModeColor(score.playMode)}`}>
                      {formatPlayModeShort(score.playMode)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {formatDate(score.date)} • {Math.round(score.averageAccuracy)}% accuracy
                  </div>
                </div>

                {/* Time */}
                <div className="flex-shrink-0 text-right">
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {formatTime(score.averageTimePerCorrectAnswer)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    per answer
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {Object.keys(allScores).length > maxItems && (
        <div className="text-center pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Showing top {maxItems} of {Object.keys(allScores).length} records
          </span>
        </div>
      )}
    </div>
  );
}
