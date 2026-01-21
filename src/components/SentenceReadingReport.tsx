import type { SentenceReadingSession } from '../types/sentenceReading';

interface SentenceReadingReportProps {
  session: SentenceReadingSession;
  onBackToMenu: () => void;
  onNewSession: () => void;
}

export function SentenceReadingReport({
  session,
  onBackToMenu,
  onNewSession,
}: SentenceReadingReportProps) {
  const { attempts } = session;
  const totalAttempts = attempts.length;

  // Calculate statistics
  const pinyinCorrect = attempts.filter(a => a.pinyinCorrect).length;
  const meaningCorrect = attempts.filter(a => a.meaningCorrect === true).length;
  const meaningIncorrect = attempts.filter(a => a.meaningCorrect === false).length;

  const pinyinAccuracy = totalAttempts > 0 ? (pinyinCorrect / totalAttempts) * 100 : 0;
  const meaningAccuracy = totalAttempts > 0 ? (meaningCorrect / totalAttempts) * 100 : 0;

  // Calculate time statistics
  const totalTimeMs = session.endTime ? session.endTime - session.startTime : 0;
  const avgTimePerSentence = totalAttempts > 0 ? totalTimeMs / totalAttempts : 0;

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };

  // Determine overall performance message
  const getPerformanceMessage = () => {
    const overallAccuracy = (pinyinAccuracy + meaningAccuracy) / 2;
    if (overallAccuracy >= 90) return { message: 'Excellent work!', color: 'text-green-600 dark:text-green-400' };
    if (overallAccuracy >= 70) return { message: 'Good progress!', color: 'text-blue-600 dark:text-blue-400' };
    if (overallAccuracy >= 50) return { message: 'Keep practicing!', color: 'text-amber-600 dark:text-amber-400' };
    return { message: 'More practice needed', color: 'text-red-600 dark:text-red-400' };
  };

  const performance = getPerformanceMessage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Session Complete
            </h1>
            <p className={`text-xl font-semibold ${performance.color}`}>
              {performance.message}
            </p>
          </div>

          {/* Main Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {totalAttempts}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Sentences
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatTime(totalTimeMs)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Time
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {pinyinAccuracy.toFixed(0)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Pinyin Accuracy
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {meaningAccuracy.toFixed(0)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Meaning Accuracy
              </div>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Pinyin Stats */}
            <div className="bg-green-50 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Pinyin Results
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Correct:</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">{pinyinCorrect}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Incorrect:</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">{totalAttempts - pinyinCorrect}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 mt-2">
                  <div
                    className="bg-green-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${pinyinAccuracy}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Meaning Stats */}
            <div className="bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Meaning Results (Self-Assessed)
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Understood:</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">{meaningCorrect}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Missed:</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">{meaningIncorrect}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 mt-2">
                  <div
                    className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${meaningAccuracy}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Time Stats */}
          <div className="bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Time Statistics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Average per sentence:</span>
                <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                  {formatTime(avgTimePerSentence)}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Difficulty range:</span>
                <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                  {session.config.difficultyRange[0]} - {session.config.difficultyRange[1]}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onBackToMenu}
              className="flex-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-semibold py-4 px-8 rounded-xl transition-colors duration-200"
            >
              Back to Menu
            </button>
            <button
              onClick={onNewSession}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-4 px-8 rounded-xl transition-colors duration-200"
            >
              Practice Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
