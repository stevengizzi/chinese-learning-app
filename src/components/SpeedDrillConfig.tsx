import { useState } from 'react';
import { useExercise } from '../contexts/ExerciseContext';

export function SpeedDrillConfig() {
  const { state, dispatch } = useExercise();
  const [baseThreshold, setBaseThreshold] = useState(3.0); // seconds
  const [incrementPerWord, setIncrementPerWord] = useState(1.0); // seconds

  const handleStartExercise = () => {
    if (state.pendingSpeedDrillExercise) {
      dispatch({
        type: 'START_SPEED_DRILL',
        payload: {
          exerciseType: state.pendingSpeedDrillExercise,
          baseThresholdMs: baseThreshold * 1000,
          incrementPerWordMs: incrementPerWord * 1000
        }
      });
    }
  };

  const handleBack = () => {
    dispatch({ type: 'BACK_TO_MENU' });
  };

  // Calculate example thresholds
  const getExampleThreshold = (wordCount: number) => {
    return baseThreshold + (wordCount - 1) * incrementPerWord;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
              Speed Drill Configuration ⚡
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Set your target speed thresholds
            </p>
          </div>

          {/* Configuration Form */}
          <div className="space-y-8">
            {/* Base Threshold */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Base Threshold (1-word answers)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={baseThreshold}
                  onChange={(e) => setBaseThreshold(parseFloat(e.target.value))}
                  className="flex-1 h-3 bg-blue-200 rounded-lg appearance-none cursor-pointer dark:bg-blue-700"
                />
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 w-20 text-center">
                  {baseThreshold.toFixed(1)}s
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Target time for single-word answers (default: 3.0s)
              </p>
            </div>

            {/* Increment Per Word */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Increment Per Extra Word
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.25"
                  value={incrementPerWord}
                  onChange={(e) => setIncrementPerWord(parseFloat(e.target.value))}
                  className="flex-1 h-3 bg-green-200 rounded-lg appearance-none cursor-pointer dark:bg-green-700"
                />
                <span className="text-2xl font-bold text-green-600 dark:text-green-400 w-20 text-center">
                  +{incrementPerWord.toFixed(2)}s
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Additional time allowed for each extra word (default: 1.0s)
              </p>
            </div>

            {/* Examples */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Example Thresholds
              </h3>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(wordCount => (
                  <div key={wordCount} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700 dark:text-gray-300">
                      {wordCount} word{wordCount > 1 ? 's' : ''}:
                    </span>
                    <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                      {getExampleThreshold(wordCount).toFixed(2)}s
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <span className="font-semibold">How it works:</span> During the exercise, you'll need to answer each prompt correctly
                AND within the threshold time. Prompts that aren't answered correctly or quickly enough will reappear until you meet
                both requirements. The exercise completes when all vocabulary has been mastered!
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={handleBack}
                className="flex-1 bg-gray-600 hover:bg-gray-700 dark:bg-gray-600 dark:hover:bg-gray-500 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200"
              >
                ← Back to Menu
              </button>
              <button
                onClick={handleStartExercise}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Start Exercise →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
