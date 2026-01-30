import { useState, useEffect, useCallback } from 'react';
import type { MultipleChoiceItem, SimilarCharactersConfig } from '../types/similarCharacters';
import { convertPinyinStringToToneMarks } from '../lib/pinyinToneConverter';
import { convertCharacters, loadCharacterSetPreference } from '../lib/characterConverter';

interface MultipleChoiceExerciseProps {
  items: MultipleChoiceItem[];
  config: SimilarCharactersConfig;
  currentIndex: number;
  onAnswer: (selectedCharacter: string, wasCorrect: boolean, responseTimeMs: number) => void;
  onNext: () => void;
  onEnd: () => void;
}

export function MultipleChoiceExercise({
  items,
  config,
  currentIndex,
  onAnswer,
  onNext,
  onEnd,
}: MultipleChoiceExerciseProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [characterSet] = useState(loadCharacterSetPreference);

  const currentItem = items[currentIndex];
  const progress = ((currentIndex + 1) / items.length) * 100;

  // Reset state when moving to next item
  useEffect(() => {
    setSelectedIndex(null);
    setShowResult(false);
    setStartTime(Date.now());
  }, [currentIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showResult) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleNext();
        }
        return;
      }

      // Number keys 1-4 or letters A-D to select
      const keyMap: Record<string, number> = {
        '1': 0, '2': 1, '3': 2, '4': 3,
        'a': 0, 'b': 1, 'c': 2, 'd': 3,
        'A': 0, 'B': 1, 'C': 2, 'D': 3,
      };

      if (keyMap[e.key] !== undefined && keyMap[e.key] < currentItem.options.length) {
        handleSelect(keyMap[e.key]);
      }

      if (e.key === 'Escape') {
        onEnd();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showResult, currentItem]);

  const handleSelect = useCallback((index: number) => {
    if (showResult) return;

    const responseTimeMs = Date.now() - startTime;
    const wasCorrect = index === currentItem.correctIndex;

    setSelectedIndex(index);
    setShowResult(true);
    onAnswer(currentItem.options[index], wasCorrect, responseTimeMs);
  }, [showResult, startTime, currentItem, onAnswer]);

  const handleNext = useCallback(() => {
    if (currentIndex < items.length - 1) {
      onNext();
    } else {
      onEnd();
    }
  }, [currentIndex, items.length, onNext, onEnd]);

  // Format pinyin for display
  const displayPinyin = convertPinyinStringToToneMarks(currentItem.targetPinyin);

  // Build prompt text based on mode
  const getPromptText = () => {
    if (config.mode === 'pinyin-to-character') {
      return displayPinyin;
    } else {
      return currentItem.targetMeaning;
    }
  };

  // Get the prompt label based on mode
  const getPromptLabel = () => {
    if (config.mode === 'pinyin-to-character') {
      return 'Which character has this pinyin?';
    } else {
      return 'Which character means:';
    }
  };

  const getButtonStyle = (index: number) => {
    if (!showResult) {
      return 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/30';
    }

    if (index === currentItem.correctIndex) {
      return 'bg-green-100 dark:bg-green-900/30 border-green-500 text-green-800 dark:text-green-300';
    }

    if (index === selectedIndex && index !== currentItem.correctIndex) {
      return 'bg-red-100 dark:bg-red-900/30 border-red-500 text-red-800 dark:text-red-300';
    }

    return 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 opacity-50';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-teal-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Progress: {currentIndex + 1} / {items.length}</span>
              <button
                onClick={onEnd}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                End Session
              </button>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Prompt */}
          <div className="text-center mb-8">
            <h2 className="text-lg text-gray-600 dark:text-gray-400 mb-2">
              {getPromptLabel()}
            </h2>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {getPromptText()}
            </div>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {currentItem.options.map((char, index) => (
              <button
                key={index}
                onClick={() => handleSelect(index)}
                disabled={showResult}
                className={`relative p-6 rounded-xl border-2 transition-all duration-200 ${getButtonStyle(index)}`}
              >
                <div className="text-6xl font-normal text-center mb-2">
                  {convertCharacters(char, characterSet)}
                </div>
                <div className="text-sm text-center text-gray-500 dark:text-gray-400">
                  {index + 1}
                </div>
                {showResult && index === currentItem.correctIndex && (
                  <div className="absolute top-2 right-2 text-green-500 text-xl">
                    ✓
                  </div>
                )}
                {showResult && index === selectedIndex && index !== currentItem.correctIndex && (
                  <div className="absolute top-2 right-2 text-red-500 text-xl">
                    ✗
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Result & Next Button */}
          {showResult && (
            <div className="text-center">
              <div className={`text-lg font-semibold mb-4 ${
                selectedIndex === currentItem.correctIndex
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {selectedIndex === currentItem.correctIndex ? 'Correct!' : 'Incorrect'}
              </div>

              {selectedIndex !== currentItem.correctIndex && (
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    The correct answer is{' '}
                    <span className="font-bold text-gray-900 dark:text-white text-lg">
                      {convertCharacters(currentItem.targetCharacter, characterSet)}
                    </span>
                  </p>
                </div>
              )}

              <button
                onClick={handleNext}
                className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 px-8 rounded-xl transition-colors"
              >
                {currentIndex < items.length - 1 ? 'Next' : 'See Results'}
              </button>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Press Enter or Space to continue
              </p>
            </div>
          )}

          {/* Keyboard Hints */}
          {!showResult && (
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              Press 1-4 or A-D to select • Esc to end
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
