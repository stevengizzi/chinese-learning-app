import { useExercise } from '../contexts/ExerciseContext';
import { generateSuggestions } from '../lib/reportGenerator';

export function ReportScreen() {
  const { state, dispatch } = useExercise();

  const handleNewSession = () => {
    dispatch({ type: 'NEW_SESSION' });
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-3">
              <span className="text-4xl">📊</span>
              <span>Session Report</span>
            </h1>
          </div>

          {hasExercises ? (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 text-center">
                  <div className="text-3xl font-bold text-blue-700">
                    {statistics.totalExercises}
                  </div>
                  <div className="text-sm text-blue-600 font-medium mt-1">
                    Exercises Completed
                  </div>
                </div>
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center">
                  <div className="text-3xl font-bold text-green-700">
                    {statistics.averageAccuracy}%
                  </div>
                  <div className="text-sm text-green-600 font-medium mt-1">
                    Average Accuracy
                  </div>
                </div>
                <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6 text-center">
                  <div className="text-3xl font-bold text-purple-700">
                    {statistics.totalCharacters}
                  </div>
                  <div className="text-sm text-purple-600 font-medium mt-1">
                    Characters Tested
                  </div>
                </div>
              </div>

              {/* Error Breakdown */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Error Breakdown:</h2>
                <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                      <span className="text-gray-700 font-medium">Tone Errors:</span>
                      <span className="text-2xl font-bold text-red-600">
                        {statistics.toneErrors}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                      <span className="text-gray-700 font-medium">Syllable Errors:</span>
                      <span className="text-2xl font-bold text-orange-600">
                        {statistics.syllableErrors}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Common Mistakes */}
              {sortedMistakes.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Common Mistakes:</h2>
                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
                    <ul className="space-y-2">
                      {sortedMistakes.map(([mistake, count], index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="text-yellow-700 font-bold">{index + 1}.</span>
                          <span className="text-gray-800 font-mono text-sm flex-1">
                            {mistake}
                          </span>
                          <span className="text-yellow-700 font-semibold">
                            ×{count}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Suggestions */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span>💡</span>
                  <span>Suggestions:</span>
                </h2>
                <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-6">
                  <ul className="space-y-3">
                    {suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="text-indigo-600 mt-1">•</span>
                        <span className="text-gray-800">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg mb-4">
                No exercises completed yet.
              </p>
              <p className="text-gray-500">
                Complete some exercises to see your performance report!
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleNewSession}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-xl transition-colors duration-200 text-lg"
            >
              Start New Session
            </button>
            {hasExercises && (
              <>
                <button
                  onClick={handleContinue}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-8 rounded-xl transition-colors duration-200 text-lg"
                >
                  Continue Session
                </button>
                <button
                  onClick={handleExportData}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-4 px-8 rounded-xl transition-colors duration-200 text-lg"
                >
                  Export Data
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
