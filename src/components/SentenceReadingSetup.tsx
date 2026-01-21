import { useState, useEffect } from 'react';
import type { SentenceReadingConfig, Sentence } from '../types/sentenceReading';

interface SentenceReadingSetupProps {
  sentences: Sentence[];
  onStart: (config: SentenceReadingConfig) => void;
  onBack: () => void;
}

const STORAGE_KEY = 'sentenceReadingSettings';

interface StoredSettings {
  difficultyMin: number;
  difficultyMax: number;
}

export function SentenceReadingSetup({ sentences, onStart, onBack }: SentenceReadingSetupProps) {
  // Load saved settings from localStorage
  const loadSavedSettings = (): StoredSettings | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  };

  const savedSettings = loadSavedSettings();

  // Difficulty range
  const [difficultyMin, setDifficultyMin] = useState(savedSettings?.difficultyMin ?? 1);
  const [difficultyMax, setDifficultyMax] = useState(savedSettings?.difficultyMax ?? 5);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    const settings: StoredSettings = {
      difficultyMin,
      difficultyMax,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [difficultyMin, difficultyMax]);

  // Count sentences in selected difficulty range
  const availableSentences = sentences.filter(
    s => s.difficulty >= difficultyMin && s.difficulty <= difficultyMax
  );

  // Count sentences by difficulty level
  const sentencesByDifficulty = [1, 2, 3, 4, 5].map(level => ({
    level,
    count: sentences.filter(s => s.difficulty === level).length,
  }));

  const handleStart = () => {
    const config: SentenceReadingConfig = {
      difficultyRange: [difficultyMin, difficultyMax],
    };
    onStart(config);
  };

  const isValid = difficultyMin <= difficultyMax && availableSentences.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Sentence Reading
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Practice reading and translating complete sentences
            </p>
          </div>

          {/* Sentence Corpus Info */}
          <div className="mb-8 bg-amber-50 dark:bg-amber-900/30 border-2 border-amber-200 dark:border-amber-700 rounded-xl p-4">
            <p className="text-center text-sm text-amber-800 dark:text-amber-200">
              <span className="font-semibold">Total sentences loaded:</span> {sentences.length}
              {sentences.length === 0 && (
                <span className="block mt-2 text-amber-600 dark:text-amber-400">
                  No sentences found. Add sentences to <code className="bg-amber-100 dark:bg-amber-800 px-1 rounded">public/docs/sentences.txt</code>
                </span>
              )}
            </p>
          </div>

          {/* Difficulty Distribution */}
          {sentences.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Sentences by Difficulty
              </h2>
              <div className="grid grid-cols-5 gap-3">
                {sentencesByDifficulty.map(({ level, count }) => {
                  const inRange = level >= difficultyMin && level <= difficultyMax;
                  return (
                    <div
                      key={level}
                      className={`p-4 rounded-lg border-2 text-center transition-all ${
                        inRange
                          ? 'bg-amber-100 dark:bg-amber-900/50 border-amber-400 dark:border-amber-600'
                          : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 opacity-50'
                      }`}
                    >
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Level {level}
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {count}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Difficulty Range */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Difficulty Range (1-5)
            </h2>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Minimum: {difficultyMin}
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={difficultyMin}
                  onChange={e => setDifficultyMin(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Maximum: {difficultyMax}
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={difficultyMax}
                  onChange={e => setDifficultyMax(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {availableSentences.length} sentences available in selected range
            </p>
          </div>

          {/* How It Works */}
          <div className="mb-8 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              How It Works
            </h3>
            <ol className="space-y-2 text-gray-600 dark:text-gray-300 list-decimal list-inside">
              <li>You'll see a Chinese sentence</li>
              <li>Type the pinyin (tone numbers like wo3 or diacritics like wǒ)</li>
              <li>Type your English translation</li>
              <li>Check your answer - pinyin is auto-graded, you self-assess the meaning</li>
              <li>See reference translations and mark if you understood correctly</li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onBack}
              className="flex-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-semibold py-4 px-8 rounded-xl transition-colors duration-200"
            >
              Back to Menu
            </button>
            <button
              onClick={handleStart}
              disabled={!isValid}
              className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-8 rounded-xl transition-colors duration-200"
            >
              {availableSentences.length === 0 ? 'No Sentences Available' : `Start (${availableSentences.length} sentences)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
