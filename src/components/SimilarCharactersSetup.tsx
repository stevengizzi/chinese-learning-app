import { useState, useEffect } from 'react';
import type {
  SimilarCharactersConfig,
  SimilarCharactersMode,
  SimilarityCategory,
  SimilarCharactersDatabase,
} from '../types/similarCharacters';
import type { VocabularyEntry } from '../types/vocabulary';
import type { ResponseDatabase } from '../types/responseTracking';
import type { VocabularyFilterConfig } from '../types/vocabularyFilter';
import { countAvailableItems } from '../lib/similarCharactersLoader';
import { VocabularyFilter } from './VocabularyFilter';
import { filterVocabulary } from '../lib/vocabularyFilter';

interface SimilarCharactersSetupProps {
  database: SimilarCharactersDatabase;
  vocabulary: VocabularyEntry[];
  responseDatabase: ResponseDatabase | null;
  onStart: (config: SimilarCharactersConfig, filteredVocabulary?: VocabularyEntry[]) => void;
  onBack: () => void;
}

const CATEGORY_LABELS: Record<SimilarityCategory, string> = {
  'radical-based': 'Same Radical',
  'stroke-similar': 'Similar Strokes',
  'component-shared': 'Shared Components',
  'mirror-image': 'Mirror Images',
  'phonetic-similar': 'Similar Sound',
};

export function SimilarCharactersSetup({
  database,
  vocabulary,
  responseDatabase,
  onStart,
  onBack,
}: SimilarCharactersSetupProps) {
  const [mode, setMode] = useState<SimilarCharactersMode>('pinyin-to-character');
  const [shuffle, setShuffle] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<SimilarityCategory[]>([]);
  const [itemCount, setItemCount] = useState(0);
  const [vocabFilter, setVocabFilter] = useState<VocabularyFilterConfig>({ type: 'all' });

  // Get filtered vocabulary based on filter config
  const filteredVocabulary = vocabFilter.type === 'all'
    ? vocabulary
    : filterVocabulary(vocabulary, vocabFilter, responseDatabase);

  // Calculate available items when config changes
  useEffect(() => {
    const config: SimilarCharactersConfig = {
      mode,
      shuffle,
      categories: selectedCategories.length > 0 ? selectedCategories : undefined,
    };
    const counts = countAvailableItems(database, filteredVocabulary, config);
    // Both modes use the same item generation logic now (multiple choice style)
    setItemCount(counts.multipleChoice);
  }, [database, filteredVocabulary, mode, shuffle, selectedCategories]);

  const handleCategoryToggle = (category: SimilarityCategory) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleStart = () => {
    const config: SimilarCharactersConfig = {
      mode,
      shuffle,
      categories: selectedCategories.length > 0 ? selectedCategories : undefined,
    };
    // Pass filtered vocabulary if a filter is applied
    onStart(config, vocabFilter.type !== 'all' ? filteredVocabulary : undefined);
  };

  const allCategories = database.metadata.categories;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-teal-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Character Recognition
            </h1>
            <button
              onClick={onBack}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Back to Menu
            </button>
          </div>

          {/* Mode Selection */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Exercise Mode
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => setMode('pinyin-to-character')}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  mode === 'pinyin-to-character'
                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/30'
                    : 'border-gray-200 dark:border-gray-600 hover:border-cyan-300'
                }`}
              >
                <div className="font-semibold text-gray-900 dark:text-white mb-1">
                  Pinyin → Character
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  See the pinyin, pick the correct character
                </div>
              </button>
              <button
                onClick={() => setMode('english-to-character')}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  mode === 'english-to-character'
                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/30'
                    : 'border-gray-200 dark:border-gray-600 hover:border-cyan-300'
                }`}
              >
                <div className="font-semibold text-gray-900 dark:text-white mb-1">
                  English → Character
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  See the meaning, pick the correct character
                </div>
              </button>
            </div>
          </div>

          {/* Vocabulary Filter */}
          <div className="mb-6">
            <VocabularyFilter
              exerciseKey="similar-characters"
              vocabulary={vocabulary}
              database={responseDatabase}
              onFilterChange={setVocabFilter}
              showRememberOption={true}
            />
          </div>

          {/* Category Filter */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Similarity Categories
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                (select none for all)
              </span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {allCategories.map(category => (
                <button
                  key={category}
                  onClick={() => handleCategoryToggle(category)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    selectedCategories.includes(category)
                      ? 'bg-cyan-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {CATEGORY_LABELS[category]}
                </button>
              ))}
            </div>
          </div>

          {/* Shuffle Toggle */}
          <div className="mb-8">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={shuffle}
                onChange={e => setShuffle(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
              />
              <span className="text-gray-900 dark:text-white font-medium">
                Shuffle order
              </span>
            </label>
          </div>

          {/* Item Count Preview */}
          <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">
                {itemCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                characters available from your vocabulary
              </div>
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={handleStart}
            disabled={itemCount === 0}
            className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed"
          >
            {itemCount === 0 ? 'No Characters Available' : 'Start Practice'}
          </button>

          {itemCount === 0 && (
            <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
              No characters from your vocabulary have similar-looking matches.
              Try selecting different categories or adding more vocabulary.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
