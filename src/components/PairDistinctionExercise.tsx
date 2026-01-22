import { useState, useEffect, useCallback } from 'react';
import type { PairDistinctionItem, SimilarCharactersConfig } from '../types/similarCharacters';
import { convertPinyinStringToToneMarks } from '../lib/pinyinToneConverter';

interface PairDistinctionExerciseProps {
  items: PairDistinctionItem[];
  config: SimilarCharactersConfig;
  currentIndex: number;
  onAnswer: (selectedCharacter: string, wasCorrect: boolean, responseTimeMs: number) => void;
  onNext: () => void;
  onEnd: () => void;
}

const DIFFICULTY_COLORS = {
  easy: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  hard: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export function PairDistinctionExercise({
  items,
  config,
  currentIndex,
  onAnswer,
  onNext,
  onEnd,
}: PairDistinctionExerciseProps) {
  const [selectedChar, setSelectedChar] = useState<'A' | 'B' | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());

  const currentItem = items[currentIndex];
  const progress = ((currentIndex + 1) / items.length) * 100;

  // Reset state when moving to next item
  useEffect(() => {
    setSelectedChar(null);
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

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' || e.key === '1') {
        handleSelect('A');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' || e.key === '2') {
        handleSelect('B');
      } else if (e.key === 'Escape') {
        onEnd();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showResult, currentItem]);

  const handleSelect = useCallback((choice: 'A' | 'B') => {
    if (showResult) return;

    const responseTimeMs = Date.now() - startTime;
    const selectedCharacter = choice === 'A' ? currentItem.characterA : currentItem.characterB;
    const wasCorrect = selectedCharacter === currentItem.targetCharacter;

    setSelectedChar(choice);
    setShowResult(true);
    onAnswer(selectedCharacter, wasCorrect, responseTimeMs);
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

  // Build prompt text
  const getPromptText = () => {
    switch (config.promptType) {
      case 'pinyin':
        return displayPinyin;
      case 'meaning':
        return currentItem.targetMeaning;
      case 'both':
      default:
        return `${displayPinyin} (${currentItem.targetMeaning})`;
    }
  };

  const getButtonStyle = (side: 'A' | 'B') => {
    const char = side === 'A' ? currentItem.characterA : currentItem.characterB;
    const isCorrect = char === currentItem.targetCharacter;
    const isSelected = selectedChar === side;

    if (!showResult) {
      return 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/30';
    }

    if (isCorrect) {
      return 'bg-green-100 dark:bg-green-900/30 border-green-500';
    }

    if (isSelected && !isCorrect) {
      return 'bg-red-100 dark:bg-red-900/30 border-red-500';
    }

    return 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 opacity-50';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-teal-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Header with Progress & Difficulty */}
          <div className="mb-6">
            <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Progress: {currentIndex + 1} / {items.length}</span>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${DIFFICULTY_COLORS[currentItem.difficulty]}`}>
                  {currentItem.difficulty}
                </span>
                <button
                  onClick={onEnd}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  End Session
                </button>
              </div>
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
              Which one means:
            </h2>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {getPromptText()}
            </div>
          </div>

          {/* Character Pair */}
          <div className="flex items-center justify-center gap-6 mb-8">
            <button
              onClick={() => handleSelect('A')}
              disabled={showResult}
              className={`relative p-8 rounded-xl border-2 transition-all duration-200 flex-1 max-w-[200px] ${getButtonStyle('A')}`}
            >
              <div className="text-7xl font-normal text-center text-gray-900 dark:text-white">
                {currentItem.characterA}
              </div>
              <div className="text-sm text-center text-gray-500 dark:text-gray-400 mt-2">
                ← Left
              </div>
              {showResult && currentItem.characterA === currentItem.targetCharacter && (
                <div className="absolute top-2 right-2 text-green-500 text-2xl">✓</div>
              )}
              {showResult && selectedChar === 'A' && currentItem.characterA !== currentItem.targetCharacter && (
                <div className="absolute top-2 right-2 text-red-500 text-2xl">✗</div>
              )}
            </button>

            <div className="text-3xl font-bold text-gray-400 dark:text-gray-500">
              vs
            </div>

            <button
              onClick={() => handleSelect('B')}
              disabled={showResult}
              className={`relative p-8 rounded-xl border-2 transition-all duration-200 flex-1 max-w-[200px] ${getButtonStyle('B')}`}
            >
              <div className="text-7xl font-normal text-center text-gray-900 dark:text-white">
                {currentItem.characterB}
              </div>
              <div className="text-sm text-center text-gray-500 dark:text-gray-400 mt-2">
                Right →
              </div>
              {showResult && currentItem.characterB === currentItem.targetCharacter && (
                <div className="absolute top-2 right-2 text-green-500 text-2xl">✓</div>
              )}
              {showResult && selectedChar === 'B' && currentItem.characterB !== currentItem.targetCharacter && (
                <div className="absolute top-2 right-2 text-red-500 text-2xl">✗</div>
              )}
            </button>
          </div>

          {/* Result & Next Button */}
          {showResult && (
            <div className="text-center">
              <div className={`text-lg font-semibold mb-4 ${
                (selectedChar === 'A' && currentItem.characterA === currentItem.targetCharacter) ||
                (selectedChar === 'B' && currentItem.characterB === currentItem.targetCharacter)
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {(selectedChar === 'A' && currentItem.characterA === currentItem.targetCharacter) ||
                 (selectedChar === 'B' && currentItem.characterB === currentItem.targetCharacter)
                  ? 'Correct!'
                  : 'Incorrect'}
              </div>

              {/* Show both characters' info after answering */}
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl mb-1">{currentItem.characterA}</div>
                    <div className="text-gray-600 dark:text-gray-400">
                      {convertPinyinStringToToneMarks(currentItem.dataA.pinyin)}
                    </div>
                    <div className="text-gray-500 dark:text-gray-500">
                      {currentItem.dataA.meaning}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">{currentItem.characterB}</div>
                    <div className="text-gray-600 dark:text-gray-400">
                      {convertPinyinStringToToneMarks(currentItem.dataB.pinyin)}
                    </div>
                    <div className="text-gray-500 dark:text-gray-500">
                      {currentItem.dataB.meaning}
                    </div>
                  </div>
                </div>
              </div>

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
              Press ← or → to select • Esc to end
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
