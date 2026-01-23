import { useState, useEffect } from 'react';
import { useExercise } from '../contexts/ExerciseContext';
import type { ExerciseType, PlayMode } from '../types/exercise';
import type { VocabularyFilterConfig } from '../types/vocabularyFilter';
import { VocabularyFilter } from './VocabularyFilter';
import { countFilteredVocabulary, getFilterForExercise } from '../lib/vocabularyFilter';

interface ExerciseConfigPanelProps {
  exerciseType: ExerciseType;
  playMode: PlayMode;
  onStart: (filter?: VocabularyFilterConfig) => void;
  onCancel: () => void;
}

const EXERCISE_LABELS: Record<ExerciseType, string> = {
  'character-to-pinyin': 'Character → Pinyin',
  'character-to-english': 'Character → English',
  'english-to-pinyin': 'English → Pinyin',
  'pinyin-to-english': 'Pinyin → English',
  'shuffled': 'Shuffled → Pinyin',
  'shuffled-to-english': 'Shuffled → English',
};

const PLAY_MODE_LABELS: Record<PlayMode, string> = {
  'endless': 'Endless Practice',
  'complete-all': 'Complete All',
  'drill': 'Drill Mode',
  'speed-drill': 'Speed Drill',
};

export function ExerciseConfigPanel({
  exerciseType,
  playMode,
  onStart,
  onCancel,
}: ExerciseConfigPanelProps) {
  const { state } = useExercise();
  const [filter, setFilter] = useState<VocabularyFilterConfig>({ type: 'all' });

  const exerciseKey = `${exerciseType}-${playMode}`;
  const vocabulary = state.vocabulary?.active || [];
  const database = state.responseDatabase;

  // Load saved filter on mount
  useEffect(() => {
    const savedFilter = getFilterForExercise(exerciseKey);
    if (savedFilter) {
      setFilter(savedFilter);
    }
  }, [exerciseKey]);

  const filteredCount = countFilteredVocabulary(vocabulary, filter, database);

  const handleStart = () => {
    onStart(filter.type === 'all' ? undefined : filter);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Configure Exercise
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {EXERCISE_LABELS[exerciseType]} • {PLAY_MODE_LABELS[playMode]}
            </p>
          </div>

          {/* Vocabulary Filter */}
          <div className="mb-6">
            <VocabularyFilter
              exerciseKey={exerciseKey}
              vocabulary={vocabulary}
              database={database}
              onFilterChange={setFilter}
              showRememberOption={true}
            />
          </div>

          {/* Summary */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
            <p className="text-center text-blue-800 dark:text-blue-200">
              <span className="font-bold text-2xl">{filteredCount}</span>
              <span className="text-sm ml-2">vocabulary items selected</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold py-3 px-4 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleStart}
              disabled={filteredCount === 0}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-colors"
            >
              Start Exercise
            </button>
          </div>

          {filteredCount === 0 && (
            <p className="mt-3 text-center text-sm text-red-600 dark:text-red-400">
              No vocabulary items match this filter. Try a different filter.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
