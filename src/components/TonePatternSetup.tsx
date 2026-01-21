import { useState, useEffect, useCallback } from 'react';
import type { TonePatternConfig, TonePatternItem, ToneSlotSelection } from '../types/tonePatternPractice';
import { loadAllTonePatternItems, countMatchingItems } from '../lib/tonePatternMatcher';

interface TonePatternSetupProps {
  onStart: (config: TonePatternConfig, items: TonePatternItem[]) => void;
  onBack: () => void;
}

const STORAGE_KEY = 'tonePatternSettings';

interface StoredSettings {
  sequenceLength: number;
  pattern: Array<number[] | 'any'>; // Serialized pattern
  displayMode: 'hanzi' | 'pinyin' | 'both';
  shuffle: boolean;
}

// Convert Set to array for storage
function serializePattern(pattern: ToneSlotSelection[]): Array<number[] | 'any'> {
  return pattern.map(slot => (slot === 'any' ? 'any' : Array.from(slot)));
}

// Convert array back to Set
function deserializePattern(stored: Array<number[] | 'any'>): ToneSlotSelection[] {
  return stored.map(slot =>
    slot === 'any' ? 'any' : new Set(slot as (1 | 2 | 3 | 4 | 5)[])
  );
}

// Create initial pattern with all slots set to 'any'
function createInitialPattern(length: number): ToneSlotSelection[] {
  return Array(length).fill('any');
}

export function TonePatternSetup({ onStart, onBack }: TonePatternSetupProps) {
  // Load saved settings
  const loadSavedSettings = (): StoredSettings | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  };

  const savedSettings = loadSavedSettings();

  const [sequenceLength, setSequenceLength] = useState(savedSettings?.sequenceLength ?? 2);
  const [pattern, setPattern] = useState<ToneSlotSelection[]>(
    savedSettings?.pattern
      ? deserializePattern(savedSettings.pattern)
      : createInitialPattern(savedSettings?.sequenceLength ?? 2)
  );
  const [displayMode, setDisplayMode] = useState<'hanzi' | 'pinyin' | 'both'>(
    savedSettings?.displayMode ?? 'both'
  );
  const [shuffle, setShuffle] = useState(savedSettings?.shuffle ?? true);

  const [allItems, setAllItems] = useState<TonePatternItem[]>([]);
  const [matchCount, setMatchCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Load items on mount
  useEffect(() => {
    loadAllTonePatternItems().then(items => {
      setAllItems(items);
      setIsLoading(false);
    });
  }, []);

  // Update match count when pattern or items change
  useEffect(() => {
    if (allItems.length > 0) {
      const count = countMatchingItems(allItems, pattern);
      setMatchCount(count);
    }
  }, [allItems, pattern]);

  // Save settings when they change
  useEffect(() => {
    const settings: StoredSettings = {
      sequenceLength,
      pattern: serializePattern(pattern),
      displayMode,
      shuffle,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [sequenceLength, pattern, displayMode, shuffle]);

  // Handle sequence length change
  const handleLengthChange = useCallback((newLength: number) => {
    setSequenceLength(newLength);
    // Adjust pattern array length
    setPattern(prev => {
      if (newLength > prev.length) {
        // Add 'any' slots for new positions
        return [...prev, ...Array(newLength - prev.length).fill('any')];
      } else {
        // Truncate
        return prev.slice(0, newLength);
      }
    });
  }, []);

  // Toggle a specific tone in a slot
  const toggleToneInSlot = useCallback((slotIndex: number, tone: 1 | 2 | 3 | 4 | 5) => {
    setPattern(prev => {
      const newPattern = [...prev];
      const currentSlot = newPattern[slotIndex];

      if (currentSlot === 'any') {
        // Switching from 'any' to a specific tone
        newPattern[slotIndex] = new Set([tone]);
      } else {
        const newSet = new Set(currentSlot);
        if (newSet.has(tone)) {
          newSet.delete(tone);
          // If empty, revert to 'any'
          if (newSet.size === 0) {
            newPattern[slotIndex] = 'any';
          } else {
            newPattern[slotIndex] = newSet;
          }
        } else {
          newSet.add(tone);
          newPattern[slotIndex] = newSet;
        }
      }

      return newPattern;
    });
  }, []);

  // Set a slot to 'any'
  const setSlotToAny = useCallback((slotIndex: number) => {
    setPattern(prev => {
      const newPattern = [...prev];
      newPattern[slotIndex] = 'any';
      return newPattern;
    });
  }, []);

  const handleStart = () => {
    const config: TonePatternConfig = {
      pattern,
      displayMode,
      shuffle,
    };
    onStart(config, allItems);
  };

  const toneLabels = [
    { tone: 1 as const, label: '1', name: 'Tone 1', color: 'red' },
    { tone: 2 as const, label: '2', name: 'Tone 2', color: 'orange' },
    { tone: 3 as const, label: '3', name: 'Tone 3', color: 'green' },
    { tone: 4 as const, label: '4', name: 'Tone 4', color: 'blue' },
    { tone: 5 as const, label: '5', name: 'Neutral', color: 'gray' },
  ];

  const getToneButtonClass = (slotIndex: number, tone: 1 | 2 | 3 | 4 | 5) => {
    const slot = pattern[slotIndex];
    const isSelected = slot !== 'any' && slot.has(tone);

    const colorClasses: Record<number, string> = {
      1: isSelected ? 'bg-red-500 text-white border-red-600' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-red-100 dark:hover:bg-red-900/30',
      2: isSelected ? 'bg-orange-500 text-white border-orange-600' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-orange-100 dark:hover:bg-orange-900/30',
      3: isSelected ? 'bg-green-500 text-white border-green-600' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-green-100 dark:hover:bg-green-900/30',
      4: isSelected ? 'bg-blue-500 text-white border-blue-600' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-blue-900/30',
      5: isSelected ? 'bg-gray-500 text-white border-gray-600' : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600',
    };

    return `px-3 py-2 border-2 rounded-lg font-bold transition-all ${colorClasses[tone]}`;
  };

  const isAnySelected = (slotIndex: number) => pattern[slotIndex] === 'any';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Tone Pattern Practice
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Practice vocabulary and sentences by tone pattern
            </p>
          </div>

          {/* Sequence Length */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Syllable Count
            </h2>
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 4, 5, 6].map(len => (
                <button
                  key={len}
                  onClick={() => handleLengthChange(len)}
                  className={`w-12 h-12 rounded-lg border-2 font-bold transition-all ${
                    sequenceLength === len
                      ? 'bg-purple-500 border-purple-600 text-white'
                      : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-purple-400'
                  }`}
                >
                  {len}
                </button>
              ))}
            </div>
          </div>

          {/* Pattern Selection */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Tone Pattern
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Select allowed tones for each position. Multiple tones can be selected per position.
              "Any" allows all tones. Patterns match <strong>pronounced</strong> tones (after sandhi).
            </p>

            <div className="space-y-4">
              {Array.from({ length: sequenceLength }).map((_, slotIndex) => (
                <div key={slotIndex} className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-20 font-medium text-gray-700 dark:text-gray-200">
                    Position {slotIndex + 1}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {toneLabels.map(({ tone, label }) => (
                      <button
                        key={tone}
                        onClick={() => toggleToneInSlot(slotIndex, tone)}
                        className={getToneButtonClass(slotIndex, tone)}
                        title={`Tone ${tone}`}
                      >
                        {label}
                      </button>
                    ))}
                    <button
                      onClick={() => setSlotToAny(slotIndex)}
                      className={`px-3 py-2 border-2 rounded-lg font-bold transition-all ${
                        isAnySelected(slotIndex)
                          ? 'bg-purple-500 text-white border-purple-600'
                          : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                      }`}
                    >
                      Any
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Match Count */}
          <div className="mb-8 p-4 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg">
            <div className="text-center">
              {isLoading ? (
                <div className="text-gray-600 dark:text-gray-300">Loading vocabulary...</div>
              ) : (
                <>
                  <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                    {matchCount}
                  </div>
                  <div className="text-gray-600 dark:text-gray-300">
                    {matchCount === 1 ? 'item matches' : 'items match'} this pattern
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Display Mode */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Display Mode
            </h2>
            <div className="flex gap-3 flex-wrap">
              {[
                { value: 'hanzi' as const, label: 'Hanzi Only', example: '你好' },
                { value: 'pinyin' as const, label: 'Pinyin Only', example: 'nǐ hǎo' },
                { value: 'both' as const, label: 'Both', example: '你好 / nǐ hǎo' },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setDisplayMode(option.value)}
                  className={`flex-1 min-w-32 p-4 rounded-lg border-2 transition-all ${
                    displayMode === option.value
                      ? 'bg-purple-500 border-purple-600 text-white'
                      : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-purple-400'
                  }`}
                >
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm mt-1 opacity-75">{option.example}</div>
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
                className="w-5 h-5 rounded"
              />
              <span className="text-gray-700 dark:text-gray-200 font-medium">
                Shuffle items
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onBack}
              className="flex-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-semibold py-4 px-8 rounded-xl transition-colors duration-200"
            >
              ← Back to Menu
            </button>
            <button
              onClick={handleStart}
              disabled={matchCount === 0 || isLoading}
              className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-8 rounded-xl transition-colors duration-200"
            >
              Start Practice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
