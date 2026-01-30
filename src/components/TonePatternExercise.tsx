import { useState, useEffect, useRef, useCallback } from 'react';
import type { TonePatternItem, TonePatternConfig } from '../types/tonePatternPractice';
import { convertCharacters, loadCharacterSetPreference } from '../lib/characterConverter';

interface TonePatternExerciseProps {
  items: TonePatternItem[];
  config: TonePatternConfig;
  currentIndex: number;
  onNext: () => void;
  onEnd: () => void;
}

// Tone colors for display
const toneColors: Record<number, string> = {
  1: 'text-red-600 dark:text-red-400',
  2: 'text-orange-600 dark:text-orange-400',
  3: 'text-green-600 dark:text-green-400',
  4: 'text-blue-600 dark:text-blue-400',
  5: 'text-gray-500 dark:text-gray-400',
};

export function TonePatternExercise({
  items,
  config,
  currentIndex,
  onNext,
  onEnd,
}: TonePatternExerciseProps) {
  const [characterSet] = useState(loadCharacterSetPreference);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const currentItem = items[currentIndex];
  const progress = ((currentIndex + 1) / items.length) * 100;

  // Keyboard handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (currentIndex < items.length - 1) {
          onNext();
        } else {
          onEnd();
        }
      } else if (e.key === 'Escape') {
        onEnd();
      }
    },
    [currentIndex, items.length, onNext, onEnd]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Focus next button on mount and when index changes
  useEffect(() => {
    nextButtonRef.current?.focus();
  }, [currentIndex]);

  if (!currentItem) {
    return null;
  }

  // Render pinyin with tone colors
  const renderColoredPinyin = () => {
    const syllables = currentItem.pinyinWithMarks.split(/\s+/);
    const tones = currentItem.pronouncedTones;

    return (
      <span className="inline-flex flex-wrap gap-x-2 justify-center">
        {syllables.map((syllable, i) => (
          <span key={i} className={tones[i] ? toneColors[tones[i]] : ''}>
            {syllable}
          </span>
        ))}
      </span>
    );
  };

  // Render tone pattern indicator
  const renderTonePattern = () => {
    const { originalTones, pronouncedTones, sandhiApplied } = currentItem;

    return (
      <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
        <span className="inline-flex gap-1">
          {pronouncedTones.map((tone, i) => (
            <span
              key={i}
              className={`px-2 py-1 rounded ${toneColors[tone]} bg-gray-100 dark:bg-gray-700 font-mono`}
            >
              {tone}
            </span>
          ))}
        </span>
        {sandhiApplied && (
          <div className="mt-1 text-xs text-purple-600 dark:text-purple-400">
            (written: {originalTones.join('-')} → pronounced: {pronouncedTones.join('-')})
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 h-2">
        <div
          className="bg-purple-500 h-2 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-3xl">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
            {/* Progress Indicator */}
            <div className="text-center text-gray-500 dark:text-gray-400 mb-6">
              {currentIndex + 1} / {items.length}
            </div>

            {/* Main Display */}
            <div className="text-center mb-8">
              {/* Hanzi */}
              {(config.displayMode === 'hanzi' || config.displayMode === 'both') && (
                <div className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
                  {convertCharacters(currentItem.hanzi, characterSet)}
                </div>
              )}

              {/* Pinyin */}
              {(config.displayMode === 'pinyin' || config.displayMode === 'both') && (
                <div className="text-2xl md:text-3xl font-medium">
                  {renderColoredPinyin()}
                </div>
              )}

              {/* Tone Pattern */}
              {renderTonePattern()}

              {/* Meaning (shown smaller) */}
              {currentItem.meaning && (
                <div className="mt-6 text-lg text-gray-600 dark:text-gray-300">
                  {currentItem.meaning}
                </div>
              )}

              {/* Source indicator */}
              <div className="mt-4 text-xs text-gray-400 dark:text-gray-500">
                Source: {currentItem.source}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-4">
              <button
                onClick={onEnd}
                className="flex-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-semibold py-4 px-8 rounded-xl transition-colors duration-200"
              >
                End Session
              </button>
              <button
                ref={nextButtonRef}
                onClick={currentIndex < items.length - 1 ? onNext : onEnd}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-8 rounded-xl transition-colors duration-200"
              >
                {currentIndex < items.length - 1 ? 'Next →' : 'Finish'}
              </button>
            </div>

            {/* Keyboard hint */}
            <div className="text-center text-sm text-gray-400 dark:text-gray-500 mt-4">
              Press Enter or Space to continue • Esc to end
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
