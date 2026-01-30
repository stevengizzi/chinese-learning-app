import { useState } from 'react';
import type { FlashcardAttempt, FlashcardConfig } from '../types/flashcard';
import { convertPinyinStringToToneMarks } from '../lib/pinyinToneConverter';
import { convertCharacters, loadCharacterSetPreference } from '../lib/characterConverter';

interface FlashcardReportProps {
  attempts: FlashcardAttempt[];
  config: FlashcardConfig;
  onBackToMenu: () => void;
  onNewSession: () => void;
}

export function FlashcardReport({
  attempts,
  config,
  onBackToMenu,
  onNewSession,
}: FlashcardReportProps) {
  const [characterSet] = useState(loadCharacterSetPreference);

  // Calculate statistics
  const totalAttempts = attempts.length;
  const correctAttempts = attempts.filter((a) => a.correct).length;
  const accuracy = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;

  // For drill mode, count unique words mastered
  const uniqueWords = new Set(attempts.map((a) => a.vocabId));

  // Average times
  const avgFlipTime =
    attempts.length > 0
      ? attempts.reduce((sum, a) => sum + a.timeToFlip, 0) / attempts.length
      : 0;
  const avgAnswerTime =
    attempts.length > 0
      ? attempts.reduce((sum, a) => sum + a.timeToAnswer, 0) / attempts.length
      : 0;
  const avgTotalTime = avgFlipTime + avgAnswerTime;

  // Find problem words (answered wrong at least once)
  const problemWords = new Map<string, FlashcardAttempt[]>();
  attempts.forEach((attempt) => {
    if (!attempt.correct) {
      const existing = problemWords.get(attempt.vocabId) || [];
      problemWords.set(attempt.vocabId, [...existing, attempt]);
    }
  });

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getModeDescription = () => {
    switch (config.playMode) {
      case 'complete-all':
        return 'Complete All';
      case 'drill':
        return 'Drill Mode';
      case 'endless':
        return 'Endless Practice';
      case 'speed-drill':
        return 'Speed Drill';
      default:
        return config.playMode;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Session Complete!
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {getModeDescription()} • Flashcard Mode
            </p>
          </div>

          {/* Main Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-rose-50 dark:bg-rose-900/20 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-rose-600 dark:text-rose-400">
                {totalAttempts}
              </div>
              <div className="text-sm text-rose-800 dark:text-rose-200">Total Cards</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {correctAttempts}
              </div>
              <div className="text-sm text-green-800 dark:text-green-200">Correct</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {accuracy.toFixed(0)}%
              </div>
              <div className="text-sm text-blue-800 dark:text-blue-200">Accuracy</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {uniqueWords.size}
              </div>
              <div className="text-sm text-purple-800 dark:text-purple-200">Unique Words</div>
            </div>
          </div>

          {/* Time Stats */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Timing
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatTime(avgFlipTime)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Avg. Think Time</div>
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatTime(avgAnswerTime)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Avg. Answer Time</div>
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatTime(avgTotalTime)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Avg. Total</div>
              </div>
            </div>
          </div>

          {/* Problem Words */}
          {problemWords.size > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Words to Review ({problemWords.size})
              </h3>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {Array.from(problemWords.entries()).map(([vocabId, wordAttempts]) => {
                  const lastAttempt = wordAttempts[wordAttempts.length - 1];
                  return (
                    <div
                      key={vocabId}
                      className="flex items-center justify-between bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-gray-900 dark:text-white">
                          {convertCharacters(lastAttempt.word, characterSet)}
                        </span>
                        <span className="text-blue-600 dark:text-blue-400">
                          {convertPinyinStringToToneMarks(lastAttempt.pinyin)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {lastAttempt.meaning}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Encouragement Message */}
          <div className="text-center mb-8">
            {accuracy >= 90 ? (
              <p className="text-lg text-green-600 dark:text-green-400 font-medium">
                Excellent work! You're mastering these flashcards!
              </p>
            ) : accuracy >= 70 ? (
              <p className="text-lg text-blue-600 dark:text-blue-400 font-medium">
                Good progress! Keep practicing to improve further.
              </p>
            ) : (
              <p className="text-lg text-amber-600 dark:text-amber-400 font-medium">
                Keep at it! Consistent practice will help these stick.
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onBackToMenu}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200"
            >
              ← Back to Menu
            </button>
            <button
              onClick={onNewSession}
              className="flex-1 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Practice Again →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
