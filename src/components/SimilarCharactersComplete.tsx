import type { SimilarCharactersSession } from '../types/similarCharacters';

interface SimilarCharactersCompleteProps {
  session: SimilarCharactersSession;
  onPracticeAgain: () => void;
  onBackToMenu: () => void;
}

export function SimilarCharactersComplete({
  session,
  onPracticeAgain,
  onBackToMenu,
}: SimilarCharactersCompleteProps) {
  const { attempts, startTime, config } = session;

  // Calculate statistics
  const totalAttempts = attempts.length;
  const correctAttempts = attempts.filter(a => a.wasCorrect).length;
  const accuracy = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;

  const totalTimeMs = attempts.length > 0
    ? attempts[attempts.length - 1].timestamp - startTime
    : 0;
  const minutes = Math.floor(totalTimeMs / 60000);
  const seconds = Math.floor((totalTimeMs % 60000) / 1000);

  const avgResponseTime = totalAttempts > 0
    ? attempts.reduce((sum, a) => sum + a.responseTimeMs, 0) / totalAttempts
    : 0;

  // Find problem pairs (incorrect answers)
  const incorrectAttempts = attempts.filter(a => !a.wasCorrect);
  const problemPairs = incorrectAttempts.map(a => ({
    selected: a.selectedCharacter,
    correct: a.correctCharacter,
  }));

  // Get unique problem pairs
  const uniqueProblemPairs = problemPairs.reduce((acc, pair) => {
    const key = `${pair.correct}-${pair.selected}`;
    if (!acc.some(p => `${p.correct}-${p.selected}` === key)) {
      acc.push(pair);
    }
    return acc;
  }, [] as typeof problemPairs);

  // Determine performance level
  const getPerformanceLevel = () => {
    if (accuracy >= 90) return { text: 'Excellent!', color: 'text-green-600 dark:text-green-400' };
    if (accuracy >= 70) return { text: 'Good job!', color: 'text-blue-600 dark:text-blue-400' };
    if (accuracy >= 50) return { text: 'Keep practicing!', color: 'text-yellow-600 dark:text-yellow-400' };
    return { text: 'Needs work', color: 'text-red-600 dark:text-red-400' };
  };

  const performance = getPerformanceLevel();

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-teal-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Session Complete!
            </h1>
            <p className={`text-xl font-semibold ${performance.color}`}>
              {performance.text}
            </p>
          </div>

          {/* Main Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <div className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">
                {accuracy.toFixed(0)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Accuracy
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <div className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">
                {correctAttempts}/{totalAttempts}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Correct
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <div className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">
                {minutes}:{seconds.toString().padStart(2, '0')}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Time
              </div>
            </div>
          </div>

          {/* Average Response Time */}
          <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl text-center">
            <div className="text-lg text-gray-600 dark:text-gray-400">
              Average response time:{' '}
              <span className="font-bold text-gray-900 dark:text-white">
                {(avgResponseTime / 1000).toFixed(1)}s
              </span>
            </div>
          </div>

          {/* Problem Pairs */}
          {uniqueProblemPairs.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Characters to Review
              </h2>
              <div className="space-y-2">
                {uniqueProblemPairs.slice(0, 5).map((pair, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{pair.correct}</span>
                      <span className="text-gray-500">confused with</span>
                      <span className="text-2xl text-red-600 dark:text-red-400">
                        {pair.selected}
                      </span>
                    </div>
                  </div>
                ))}
                {uniqueProblemPairs.length > 5 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    +{uniqueProblemPairs.length - 5} more pairs to review
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Session Info */}
          <div className="mb-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Mode: {config.mode === 'pinyin-to-character' ? 'Pinyin → Character' : 'English → Character'}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onPracticeAgain}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-4 px-8 rounded-xl transition-colors"
            >
              Practice Again
            </button>
            <button
              onClick={onBackToMenu}
              className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold py-4 px-8 rounded-xl transition-colors"
            >
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
