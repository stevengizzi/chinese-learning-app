import { useEffect, useState } from 'react';
import { useExercise } from '../contexts/ExerciseContext';
import { generateSuggestions } from '../lib/reportGenerator';
import { updateHighScore, formatTime } from '../lib/highScores';
import { loadResponseDatabase } from '../lib/responseTracking/storage';
import { generateSpeedReport, formatResponseTime } from '../lib/responseTracking/analytics';
import type { SpeedReport } from '../types/responseTracking';
import { convertCharacters, loadCharacterSetPreference } from '../lib/characterConverter';

export function ReportScreen() {
  const { state, dispatch } = useExercise();
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [speedReport, setSpeedReport] = useState<SpeedReport | null>(null);
  const [characterSet] = useState(loadCharacterSetPreference);

  // Check and save high score when session is available
  useEffect(() => {
    if (!state.currentSession) return;

    const { statistics, exerciseType, playMode, remainingWords } = state.currentSession;

    // Determine if session was completed
    const isCompleted =
      playMode === 'endless' || // Endless mode always counts
      (remainingWords !== undefined && remainingWords.length === 0); // Complete-all/drill only if finished

    // Only save high score if we have timing data, at least one correct answer, and session was completed
    if (statistics.averageTimePerCorrectAnswer !== undefined && isCompleted) {
      const wasNewHighScore = updateHighScore(
        exerciseType,
        playMode,
        statistics.averageTimePerCorrectAnswer,
        statistics.totalExercises,
        statistics.averageAccuracy
      );
      setIsNewHighScore(wasNewHighScore);
    }
  }, [state.currentSession]);

  // Generate speed report when session is available
  useEffect(() => {
    if (state.currentSession) {
      loadResponseDatabase().then(db => {
        const report = generateSpeedReport(state.currentSession!, db);
        setSpeedReport(report);
      });
    }
  }, [state.currentSession]);

  const handleBackToMenu = () => {
    dispatch({ type: 'BACK_TO_MENU' });
  };

  const handleContinue = () => {
    dispatch({ type: 'NEXT_EXERCISE' });
  };

  const handleExportData = () => {
    if (!state.currentSession) return;

    const dataStr = JSON.stringify(state.currentSession, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `session-${state.currentSession.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!state.currentSession) return null;

  const { statistics } = state.currentSession;
  const suggestions = generateSuggestions(statistics);

  const sortedMistakes = Object.entries(statistics.commonMistakes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const hasExercises = statistics.totalExercises > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
          {/* Centered Content Container */}
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-3">
                <span className="text-4xl">📊</span>
                <span>Session Report</span>
              </h1>
            </div>

            {hasExercises ? (
              <>
                {/* New High Score Banner */}
                {isNewHighScore && statistics.averageTimePerCorrectAnswer !== undefined && (
                  <div className="mb-6">
                    <div className="bg-gradient-to-r from-yellow-100 to-yellow-50 dark:from-yellow-900/50 dark:to-yellow-800/30 border-2 border-yellow-400 dark:border-yellow-600 rounded-xl p-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-yellow-800 dark:text-yellow-200 font-bold text-lg">
                        <span className="text-2xl">🏆</span>
                        <span>New High Score!</span>
                        <span className="text-2xl">🏆</span>
                      </div>
                      <div className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                        Best average time per correct answer for this mode
                      </div>
                    </div>
                  </div>
                )}

                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                  <div className="bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-6 text-center">
                    <div className="text-sm text-blue-600 dark:text-blue-300 font-medium mb-2">
                      Exercises Completed
                    </div>
                    <div className="text-xl font-bold text-blue-700 dark:text-blue-200">
                      {statistics.totalExercises}
                    </div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-700 rounded-xl p-6 text-center">
                    <div className="text-sm text-green-600 dark:text-green-300 font-medium mb-2">
                      Average Accuracy
                    </div>
                    <div className="text-xl font-bold text-green-700 dark:text-green-200">
                      {statistics.averageAccuracy}%
                    </div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/30 border-2 border-purple-200 dark:border-purple-700 rounded-xl p-6 text-center">
                    <div className="text-sm text-purple-600 dark:text-purple-300 font-medium mb-2">
                      Characters Tested
                    </div>
                    <div className="text-xl font-bold text-purple-700 dark:text-purple-200">
                      {statistics.totalCharacters}
                    </div>
                  </div>
                </div>

                {/* Timing Metrics */}
                {statistics.totalTimeMs !== undefined && (
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Timing Metrics</h2>
                    <div className="bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl p-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-600 rounded-lg">
                          <span className="text-gray-700 dark:text-gray-200 font-medium">Total Time</span>
                          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {formatTime(statistics.totalTimeMs)}
                          </span>
                        </div>
                        {statistics.averageTimePerCorrectAnswer !== undefined && (
                          <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-600 rounded-lg">
                            <span className="text-gray-700 dark:text-gray-200 font-medium">Avg Time / Correct Answer</span>
                            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {formatTime(statistics.averageTimePerCorrectAnswer)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Speed Performance */}
                {speedReport && speedReport.entriesPracticed > 0 && (
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Speed Performance</h2>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-4 text-center">
                        <div className="text-sm text-blue-600 dark:text-blue-300 font-medium mb-1">
                          Session Average
                        </div>
                        <div className="text-2xl font-bold text-blue-700 dark:text-blue-200">
                          {formatResponseTime(speedReport.sessionAverageMs)}
                        </div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-700 rounded-xl p-4 text-center">
                        <div className="text-sm text-green-600 dark:text-green-300 font-medium mb-1">
                          Fastest
                        </div>
                        <div className="text-2xl font-bold text-green-700 dark:text-green-200">
                          {formatResponseTime(speedReport.fastestResponseMs)}
                        </div>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/30 border-2 border-purple-200 dark:border-purple-700 rounded-xl p-4 text-center">
                        <div className="text-sm text-purple-600 dark:text-purple-300 font-medium mb-1">
                          vs Global Avg
                        </div>
                        <div className="text-2xl font-bold text-purple-700 dark:text-purple-200">
                          {speedReport.improvement > 0 ? '+' : ''}{speedReport.improvement.toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    {/* Fastest/Slowest entries */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Fastest Responses</h3>
                        <ul className="space-y-1">
                          {speedReport.fastestEntries.slice(0, 3).map((entry, i) => (
                            <li key={i} className="text-sm text-gray-700 dark:text-gray-300">
                              {convertCharacters(entry.character, characterSet)}: {formatResponseTime(entry.timeMs)}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Slowest Responses</h3>
                        <ul className="space-y-1">
                          {speedReport.slowestEntries.slice(0, 3).map((entry, i) => (
                            <li key={i} className="text-sm text-gray-700 dark:text-gray-300">
                              {convertCharacters(entry.character, characterSet)}: {formatResponseTime(entry.timeMs)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Breakdown */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Error Breakdown</h2>
                  <div className="bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-600 rounded-lg">
                        <span className="text-gray-700 dark:text-gray-200 font-medium">Tone Errors</span>
                        <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {statistics.toneErrors}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-600 rounded-lg">
                        <span className="text-gray-700 dark:text-gray-200 font-medium">Syllable Errors</span>
                        <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          {statistics.syllableErrors}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Common Mistakes */}
                {sortedMistakes.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Common Mistakes</h2>
                    <div className="bg-yellow-50 dark:bg-yellow-900/30 border-2 border-yellow-200 dark:border-yellow-700 rounded-xl p-6">
                    <ul className="space-y-2">
                      {sortedMistakes.map(([mistake, count], index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="text-yellow-700 dark:text-yellow-300 font-bold">{index + 1}.</span>
                          <span className="text-gray-800 dark:text-gray-200 font-mono text-sm flex-1">
                            {mistake}
                          </span>
                          <span className="text-yellow-700 dark:text-yellow-300 font-semibold">
                            ×{count}
                          </span>
                        </li>
                      ))}
                    </ul>
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                <div className="mb-12">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span>💡</span>
                    <span>Suggestions</span>
                  </h2>
                  <div className="bg-indigo-50 dark:bg-indigo-900/30 border-2 border-indigo-200 dark:border-indigo-700 rounded-xl p-6">
                    <ul className="space-y-3">
                      {suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-indigo-600 dark:text-indigo-400 mt-1">•</span>
                          <span className="text-gray-800 dark:text-gray-200">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-300 text-lg mb-4">
                No exercises completed yet.
              </p>
              <p className="text-gray-500 dark:text-gray-400">
                Complete some exercises to see your performance report!
              </p>
            </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 my-2">
              <button
                onClick={handleBackToMenu}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-xl transition-colors duration-200 text-lg my-1"
              >
                Back to Main Menu
              </button>
              {hasExercises && state.currentSession?.playMode === 'endless' && (
                <button
                  onClick={handleContinue}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-8 rounded-xl transition-colors duration-200 text-lg my-1"
                >
                  Continue Session
                </button>
              )}
              {hasExercises && (
                <button
                  onClick={handleExportData}
                  className="flex-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-semibold py-4 px-8 rounded-xl transition-colors duration-200 text-lg my-1"
                >
                  Export Data
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
