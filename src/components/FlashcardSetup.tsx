import { useState } from 'react';
import type { VocabularyEntry } from '../types/vocabulary';
import type { ResponseDatabase } from '../types/responseTracking';
import type { PlayMode } from '../types/exercise';
import type { VocabularyFilterConfig } from '../types/vocabularyFilter';
import type { FlashcardConfig, FlashcardPart, FlashcardSideConfig } from '../types/flashcard';
import { isValidSideConfig, getPartLabel } from '../types/flashcard';
import { VocabularyFilter } from './VocabularyFilter';
import { countFilteredVocabulary, filterVocabulary, hasMasteryFilterActive } from '../lib/vocabularyFilter';

interface FlashcardSetupProps {
  vocabulary: VocabularyEntry[];
  database: ResponseDatabase | null;
  onStart: (config: FlashcardConfig, filteredVocab: VocabularyEntry[]) => void;
  onBack: () => void;
  initialPlayMode?: PlayMode;
}

const PLAY_MODES: { mode: PlayMode; name: string; description: string }[] = [
  { mode: 'complete-all', name: 'Complete All', description: 'Go through each card once' },
  { mode: 'drill', name: 'Drill Mode', description: 'Repeat until all correct' },
  { mode: 'endless', name: 'Endless', description: 'Keep practicing indefinitely' },
  { mode: 'speed-drill', name: 'Speed Drill', description: 'Focus on speed with repetition' },
];

const ALL_PARTS: FlashcardPart[] = ['hanzi', 'pinyin', 'english'];

export function FlashcardSetup({
  vocabulary,
  database,
  onStart,
  onBack,
  initialPlayMode,
}: FlashcardSetupProps) {
  const [playMode, setPlayMode] = useState<PlayMode>(initialPlayMode || 'complete-all');
  const [vocabFilter, setVocabFilter] = useState<VocabularyFilterConfig>({ type: 'all' });

  // Side configuration - what appears on front and back
  const [frontParts, setFrontParts] = useState<Set<FlashcardPart>>(new Set(['hanzi']));
  const [backParts, setBackParts] = useState<Set<FlashcardPart>>(new Set(['pinyin', 'english']));

  // Speed drill settings
  const [baseThreshold, setBaseThreshold] = useState(3.0);

  const filteredCount = countFilteredVocabulary(vocabulary, vocabFilter, database);
  const exerciseKey = `flashcard-${playMode}`;

  const sideConfig: FlashcardSideConfig = {
    front: Array.from(frontParts),
    back: Array.from(backParts),
  };

  const isConfigValid = isValidSideConfig(sideConfig) && filteredCount > 0;

  const togglePart = (part: FlashcardPart, side: 'front' | 'back') => {
    if (side === 'front') {
      const newFront = new Set(frontParts);
      const newBack = new Set(backParts);

      if (newFront.has(part)) {
        // Remove from front, add to back
        newFront.delete(part);
        newBack.add(part);
      } else {
        // Add to front, remove from back
        newFront.add(part);
        newBack.delete(part);
      }

      setFrontParts(newFront);
      setBackParts(newBack);
    } else {
      const newFront = new Set(frontParts);
      const newBack = new Set(backParts);

      if (newBack.has(part)) {
        // Remove from back, add to front
        newBack.delete(part);
        newFront.add(part);
      } else {
        // Add to back, remove from front
        newBack.add(part);
        newFront.delete(part);
      }

      setFrontParts(newFront);
      setBackParts(newBack);
    }
  };

  const handleStart = () => {
    if (!isConfigValid) return;

    const config: FlashcardConfig = {
      playMode,
      sideConfig,
      ...(playMode === 'speed-drill' && {
        speedDrillCount: filteredCount,
        speedDrillThreshold: baseThreshold * 1000,
      }),
    };

    const shouldIncludeFilter = vocabFilter.type !== 'all' || hasMasteryFilterActive(vocabFilter);
    const filteredVocab = shouldIncludeFilter
      ? filterVocabulary(vocabulary, vocabFilter, database)
      : vocabulary;

    onStart(config, filteredVocab);
  };

  // Preset configurations
  const applyPreset = (preset: 'hanzi-to-english' | 'hanzi-to-pinyin' | 'english-to-hanzi' | 'pinyin-to-hanzi') => {
    switch (preset) {
      case 'hanzi-to-english':
        setFrontParts(new Set(['hanzi']));
        setBackParts(new Set(['pinyin', 'english']));
        break;
      case 'hanzi-to-pinyin':
        setFrontParts(new Set(['hanzi']));
        setBackParts(new Set(['pinyin', 'english']));
        break;
      case 'english-to-hanzi':
        setFrontParts(new Set(['english']));
        setBackParts(new Set(['hanzi', 'pinyin']));
        break;
      case 'pinyin-to-hanzi':
        setFrontParts(new Set(['pinyin']));
        setBackParts(new Set(['hanzi', 'english']));
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
              Flashcard Mode
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Configure your flashcard practice session
            </p>
          </div>

          <div className="space-y-8">
            {/* Play Mode Selection */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Practice Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                {PLAY_MODES.map(({ mode, name, description }) => (
                  <button
                    key={mode}
                    onClick={() => setPlayMode(mode)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      playMode === mode
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/30'
                        : 'border-gray-200 dark:border-gray-600 hover:border-rose-300 dark:hover:border-rose-600'
                    }`}
                  >
                    <div className="font-semibold text-gray-900 dark:text-white">{name}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Speed Drill Settings */}
            {playMode === 'speed-drill' && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-700 rounded-xl p-4 space-y-4">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100">Speed Settings</h3>
                <div>
                  <label className="block text-sm text-amber-800 dark:text-amber-200 mb-2">
                    Base Threshold: {baseThreshold.toFixed(1)}s
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    value={baseThreshold}
                    onChange={(e) => setBaseThreshold(parseFloat(e.target.value))}
                    className="w-full h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer dark:bg-amber-700"
                  />
                </div>
              </div>
            )}

            {/* Card Side Configuration */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Card Configuration
              </label>

              {/* Preset Buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => applyPreset('hanzi-to-english')}
                  className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-700 dark:text-gray-300 transition-colors"
                >
                  Hanzi → English
                </button>
                <button
                  onClick={() => applyPreset('english-to-hanzi')}
                  className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-700 dark:text-gray-300 transition-colors"
                >
                  English → Hanzi
                </button>
                <button
                  onClick={() => applyPreset('pinyin-to-hanzi')}
                  className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-700 dark:text-gray-300 transition-colors"
                >
                  Pinyin → Hanzi
                </button>
              </div>

              {/* Side Configuration */}
              <div className="grid grid-cols-2 gap-4">
                {/* Front Side */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-4">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 text-center">
                    Front (Question)
                  </h4>
                  <div className="space-y-2">
                    {ALL_PARTS.map((part) => (
                      <label
                        key={part}
                        className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/30"
                      >
                        <input
                          type="checkbox"
                          checked={frontParts.has(part)}
                          onChange={() => togglePart(part, 'front')}
                          className="w-5 h-5 rounded border-blue-300 dark:border-blue-600 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-blue-800 dark:text-blue-200 font-medium">
                          {getPartLabel(part)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Back Side */}
                <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700 rounded-xl p-4">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-3 text-center">
                    Back (Answer)
                  </h4>
                  <div className="space-y-2">
                    {ALL_PARTS.map((part) => (
                      <label
                        key={part}
                        className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-800/30"
                      >
                        <input
                          type="checkbox"
                          checked={backParts.has(part)}
                          onChange={() => togglePart(part, 'back')}
                          className="w-5 h-5 rounded border-green-300 dark:border-green-600 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-green-800 dark:text-green-200 font-medium">
                          {getPartLabel(part)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Validation Message */}
              {!isValidSideConfig(sideConfig) && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-3 text-center">
                  Each side must have at least one element, and elements cannot overlap.
                </p>
              )}
            </div>

            {/* Vocabulary Filter */}
            <div>
              <VocabularyFilter
                exerciseKey={exerciseKey}
                vocabulary={vocabulary}
                database={database}
                onFilterChange={setVocabFilter}
                showRememberOption={true}
              />
            </div>

            {/* Filtered Count */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-rose-600 dark:text-rose-400">
                  {filteredCount}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  flashcards selected
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={onBack}
                className="flex-1 bg-gray-600 hover:bg-gray-700 dark:bg-gray-600 dark:hover:bg-gray-500 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200"
              >
                ← Back to Menu
              </button>
              <button
                onClick={handleStart}
                disabled={!isConfigValid}
                className="flex-1 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed"
              >
                {filteredCount === 0 ? 'No Cards Selected' : 'Start Flashcards →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
