import { useState } from 'react';
import type { InterrogativeSession, InterrogativeItem, QuestionType } from '../types/interrogative';
import { QUESTION_DISPLAY_NAMES, QUESTION_COLORS, ALL_QUESTION_TYPES } from '../types/interrogative';
import { convertPinyinStringToToneMarks } from '../lib/pinyinToneConverter';
import { convertCharacters, loadCharacterSetPreference } from '../lib/characterConverter';

interface InterrogativeReportProps {
  session: InterrogativeSession;
  items: InterrogativeItem[];
  onBackToMenu: () => void;
  onNewSession: () => void;
}

interface QuestionStats {
  total: number;
  correct: number;
  avgTimeMs: number;
}

export function InterrogativeReport({
  session,
  items,
  onBackToMenu,
  onNewSession,
}: InterrogativeReportProps) {
  const [characterSet] = useState(loadCharacterSetPreference);
  const { attempts, startTime, endTime } = session;

  // Calculate overall stats
  const totalAttempts = attempts.length;
  const correctAttempts = attempts.filter(a => a.isCorrect).length;
  const accuracy = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;
  const totalTimeMs = endTime ? endTime - startTime : Date.now() - startTime;
  const avgTimePerItem = totalAttempts > 0 ? totalTimeMs / totalAttempts : 0;

  // Calculate stats by question type
  const statsByType: Record<QuestionType, QuestionStats> = {} as Record<QuestionType, QuestionStats>;

  for (const type of ALL_QUESTION_TYPES) {
    const typeAttempts = attempts.filter(a => a.questionType === type);
    const typeCorrect = typeAttempts.filter(a => a.isCorrect).length;
    const typeTotalTime = typeAttempts.reduce((sum, a) => sum + a.timeMs, 0);

    statsByType[type] = {
      total: typeAttempts.length,
      correct: typeCorrect,
      avgTimeMs: typeAttempts.length > 0 ? typeTotalTime / typeAttempts.length : 0,
    };
  }

  // Get problem items (incorrect answers)
  const problemAttempts = attempts.filter(a => !a.isCorrect);

  // Format time
  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  // Get item by ID
  const getItem = (itemId: string): InterrogativeItem | undefined => {
    return items.find(item => item.id === itemId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Session Complete!
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Question Words Practice
            </p>
          </div>

          {/* Overall Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-blue-800 dark:text-blue-200">
                {accuracy.toFixed(0)}%
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">
                Accuracy
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-green-800 dark:text-green-200">
                {correctAttempts}/{totalAttempts}
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">
                Correct
              </div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-700 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-purple-800 dark:text-purple-200">
                {formatDuration(totalTimeMs)}
              </div>
              <div className="text-sm text-purple-600 dark:text-purple-400">
                Total Time
              </div>
            </div>
          </div>

          {/* Stats by Question Type */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Performance by Question Type
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {ALL_QUESTION_TYPES.map(type => {
                const stats = statsByType[type];
                if (stats.total === 0) return null;

                const typeAccuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
                const colors = QUESTION_COLORS[type];

                return (
                  <div
                    key={type}
                    className={`p-3 rounded-lg border-2 ${colors.bg} ${colors.border}`}
                  >
                    <div className={`text-sm font-medium ${colors.text} truncate`}>
                      {QUESTION_DISPLAY_NAMES[type]}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className={`text-lg font-bold ${colors.text}`}>
                        {typeAccuracy.toFixed(0)}%
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {stats.correct}/{stats.total}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Avg: {formatTime(stats.avgTimeMs)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Problem Items */}
          {problemAttempts.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Items to Review ({problemAttempts.length})
              </h2>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {problemAttempts.map((attempt, index) => {
                  const item = getItem(attempt.itemId);
                  if (!item) return null;

                  const colors = QUESTION_COLORS[attempt.questionType];

                  return (
                    <div
                      key={`${attempt.itemId}-${index}`}
                      className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {item.englishPrompt}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-lg text-gray-900 dark:text-white">
                              {convertCharacters(item.chineseAnswer, characterSet)}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {convertPinyinStringToToneMarks(item.pinyin)}
                            </span>
                          </div>
                          {attempt.userAnswer && (
                            <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                              Your answer: {attempt.userAnswer}
                            </div>
                          )}
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${colors.bg} ${colors.text} ${colors.border} border`}
                        >
                          {QUESTION_DISPLAY_NAMES[attempt.questionType]}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Average response time */}
          <div className="text-center text-gray-600 dark:text-gray-400 mb-8">
            Average response time: <span className="font-semibold">{formatTime(avgTimePerItem)}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onBackToMenu}
              className="flex-1 py-3 px-6 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold rounded-xl transition-colors"
            >
              Back to Menu
            </button>
            <button
              onClick={onNewSession}
              className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              Practice Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
