import { useState, useEffect } from 'react';
import { useExercise } from '../contexts/ExerciseContext';
import { loadResponseDatabase, generateVocabularyId } from '../lib/responseTracking/storage';
import { formatResponseTime } from '../lib/responseTracking/analytics';
import type { ResponseDatabase } from '../types/responseTracking';

export function ViewVocabulary() {
  const { state, dispatch } = useExercise();
  const [searchQuery, setSearchQuery] = useState('');
  const [responseDatabase, setResponseDatabase] = useState<ResponseDatabase | null>(null);

  // Reload database whenever this component is shown
  useEffect(() => {
    loadResponseDatabase().then(db => {
      setResponseDatabase(db);
    });
  }, [state.screen]); // Reload when screen changes (including when returning to this view)

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

  // Filter vocabulary based on search query
  const filteredVocabulary = sortedVocabulary.filter((entry) => {
    if (!searchQuery) return true;

    let query = searchQuery.toLowerCase();
    const word = entry.word.toLowerCase();
    const pinyin = entry.pinyin.toLowerCase();
    const meaning = entry.meaning.toLowerCase();

    // Check for prefix-based filtering
    if (query.startsWith('hz:')) {
      // Character-only search
      const searchTerm = query.slice(3);
      return word.startsWith(searchTerm);
    } else if (query.startsWith('py:')) {
      // Pinyin-only search
      const searchTerm = query.slice(3);
      return pinyin.startsWith(searchTerm) ||
             new RegExp(`[\\s,]${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(pinyin);
    } else if (query.startsWith('en:')) {
      // Meaning-only search
      const searchTerm = query.slice(3);
      return meaning.startsWith(searchTerm) ||
             new RegExp(`[\\s;]${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(meaning);
    }

    // Match only if query appears at the start of a word
    // For Chinese characters, match at start of string
    // For pinyin and meaning, match at start of string or after word boundary (space, semicolon)
    const wordMatch = word.startsWith(query);
    const pinyinMatch = pinyin.startsWith(query) ||
                       new RegExp(`[\\s]${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(pinyin);
    const meaningMatch = meaning.startsWith(query) ||
                        new RegExp(`[\\s;]${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(meaning);

    return wordMatch || pinyinMatch || meaningMatch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
          {/* Header */}
          <div className="mb-8 flex justify-center">
            <div className="w-full flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Active Vocabulary</h1>
              <button
                onClick={handleBackToMenu}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm font-medium"
              >
                ← Back to Menu
              </button>
            </div>
          </div>

          {/* Search Field */}
          <div className="mb-6">
            <div className="max-w-md mx-auto">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 text-center">
                Prefix search with <span className="font-mono font-semibold">hz:</span> (characters), <span className="font-mono font-semibold">py:</span> (pinyin), or <span className="font-mono font-semibold">en:</span> (meaning)
              </p>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by character, pinyin, or meaning..."
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all"
                autoComplete="off"
                spellCheck="false"
              />
            </div>
          </div>

          {/* Vocabulary count */}
          <div className="mb-6 flex justify-center">
            <div className="bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-4">
              <p className="text-center text-sm text-blue-800 dark:text-blue-200">
                <span className="font-semibold">
                  {searchQuery ? `Showing ${filteredVocabulary.length} of ${sortedVocabulary.length} words` : `Total words: ${sortedVocabulary.length}`}
                </span>
              </p>
            </div>
          </div>

          {/* Vocabulary Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700 border-b-2 border-gray-300 dark:border-gray-600">
                  <th className="text-left p-3 font-semibold text-gray-900 dark:text-white">Character</th>
                  <th className="text-left p-3 font-semibold text-gray-900 dark:text-white">Pinyin</th>
                  <th className="text-left p-3 font-semibold text-gray-900 dark:text-white">Meaning</th>
                  <th className="text-center p-3 font-semibold text-gray-900 dark:text-white" title="Character → Pinyin average speed">字→拼</th>
                  <th className="text-center p-3 font-semibold text-gray-900 dark:text-white" title="Character → English average speed">字→英</th>
                  <th className="text-center p-3 font-semibold text-gray-900 dark:text-white" title="Pinyin → English average speed">拼→英</th>
                  <th className="text-center p-3 font-semibold text-gray-900 dark:text-white" title="English → Pinyin average speed">英→拼</th>
                </tr>
              </thead>
              <tbody>
                {filteredVocabulary.length > 0 ? (
                  filteredVocabulary.map((entry, index) => {
                    const vocabId = generateVocabularyId(entry.word, entry.pinyin, entry.meaning);
                    const stats = responseDatabase?.statistics[vocabId];

                    return (
                      <tr
                        key={index}
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="p-3 text-2xl text-gray-900 dark:text-white">{entry.word}</td>
                        <td className="p-3 text-gray-700 dark:text-gray-300">{entry.pinyin}</td>
                        <td className="p-3 text-gray-700 dark:text-gray-300">{entry.meaning}</td>
                        <td className="p-3 text-center text-gray-700 dark:text-gray-300">
                          {stats?.byPromptType?.['character-to-pinyin']?.correctAttempts ?? 0 > 0
                            ? formatResponseTime(stats?.byPromptType?.['character-to-pinyin']?.averageResponseTimeMs ?? 0)
                            : '—'}
                        </td>
                        <td className="p-3 text-center text-gray-700 dark:text-gray-300">
                          {stats?.byPromptType?.['character-to-english']?.correctAttempts ?? 0 > 0
                            ? formatResponseTime(stats?.byPromptType?.['character-to-english']?.averageResponseTimeMs ?? 0)
                            : '—'}
                        </td>
                        <td className="p-3 text-center text-gray-700 dark:text-gray-300">
                          {stats?.byPromptType?.['pinyin-to-english']?.correctAttempts ?? 0 > 0
                            ? formatResponseTime(stats?.byPromptType?.['pinyin-to-english']?.averageResponseTimeMs ?? 0)
                            : '—'}
                        </td>
                        <td className="p-3 text-center text-gray-700 dark:text-gray-300">
                          {stats?.byPromptType?.['english-to-pinyin']?.correctAttempts ?? 0 > 0
                            ? formatResponseTime(stats?.byPromptType?.['english-to-pinyin']?.averageResponseTimeMs ?? 0)
                            : '—'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500 dark:text-gray-400">
                      No matching vocabulary found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}
