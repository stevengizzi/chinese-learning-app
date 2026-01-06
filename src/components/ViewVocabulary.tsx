import { useExercise } from '../contexts/ExerciseContext';

export function ViewVocabulary() {
  const { state, dispatch } = useExercise();

  const handleBackToMenu = () => {
    dispatch({ type: 'BACK_TO_MENU' });
  };

  if (!state.vocabulary) {
    return null;
  }

  // Sort vocabulary alphabetically by pinyin
  const sortedVocabulary = [...state.vocabulary.active].sort((a, b) =>
    a.pinyin.localeCompare(b.pinyin)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* Header */}
          <div className="mb-8 flex justify-center">
            <div className="w-full flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">Active Vocabulary</h1>
              <button
                onClick={handleBackToMenu}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                ← Back to Menu
              </button>
            </div>
          </div>

          {/* Vocabulary count */}
          <div className="mb-6 flex justify-center">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <p className="text-center text-sm text-blue-800">
                <span className="font-semibold">Total words:</span> {sortedVocabulary.length}
              </p>
            </div>
          </div>

          {/* Vocabulary Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-300">
                  <th className="text-left p-4 font-semibold text-gray-900">Character</th>
                  <th className="text-left p-4 font-semibold text-gray-900">Pinyin</th>
                  <th className="text-left p-4 font-semibold text-gray-900">Meaning</th>
                </tr>
              </thead>
              <tbody>
                {sortedVocabulary.map((entry, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td className="p-4 text-2xl text-gray-900">{entry.word}</td>
                    <td className="p-4 text-gray-700">{entry.pinyin}</td>
                    <td className="p-4 text-gray-700">{entry.meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Back button at bottom */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleBackToMenu}
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 my-1"
            >
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
