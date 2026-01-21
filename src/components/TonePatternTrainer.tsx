import { useState, useCallback } from 'react';
import type { TonePatternConfig, TonePatternItem } from '../types/tonePatternPractice';
import { filterByPattern, shuffleItems } from '../lib/tonePatternMatcher';
import { TonePatternSetup } from './TonePatternSetup';
import { TonePatternExercise } from './TonePatternExercise';

type Screen = 'setup' | 'exercise' | 'complete';

interface TonePatternTrainerProps {
  onBack: () => void;
}

export function TonePatternTrainer({ onBack }: TonePatternTrainerProps) {
  const [screen, setScreen] = useState<Screen>('setup');
  const [config, setConfig] = useState<TonePatternConfig | null>(null);
  const [exerciseItems, setExerciseItems] = useState<TonePatternItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);

  const handleStart = useCallback((newConfig: TonePatternConfig, allItems: TonePatternItem[]) => {
    // Filter items by pattern
    let filtered = filterByPattern(allItems, newConfig.pattern);

    // Shuffle if requested
    if (newConfig.shuffle) {
      filtered = shuffleItems(filtered);
    }

    setConfig(newConfig);
    setExerciseItems(filtered);
    setCurrentIndex(0);
    setStartTime(Date.now());
    setScreen('exercise');
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => prev + 1);
  }, []);

  const handleEnd = useCallback(() => {
    setScreen('complete');
  }, []);

  const handleRestart = useCallback(() => {
    setScreen('setup');
    setConfig(null);
    setExerciseItems([]);
    setCurrentIndex(0);
  }, []);

  // Setup screen
  if (screen === 'setup') {
    return <TonePatternSetup onStart={handleStart} onBack={onBack} />;
  }

  // Exercise screen
  if (screen === 'exercise' && config) {
    return (
      <TonePatternExercise
        items={exerciseItems}
        config={config}
        currentIndex={currentIndex}
        onNext={handleNext}
        onEnd={handleEnd}
      />
    );
  }

  // Complete screen
  if (screen === 'complete') {
    const duration = Math.round((Date.now() - startTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
        <div className="w-full max-w-xl">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12 text-center">
            <div className="text-6xl mb-6">🎉</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Session Complete!
            </h1>

            <div className="mb-8 space-y-4">
              <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                  {exerciseItems.length}
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  items practiced
                </div>
              </div>

              <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-gray-700 dark:text-gray-200">
                  {minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  total time
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={onBack}
                className="flex-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-semibold py-4 px-8 rounded-xl transition-colors duration-200"
              >
                Main Menu
              </button>
              <button
                onClick={handleRestart}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-8 rounded-xl transition-colors duration-200"
              >
                Practice Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback
  return null;
}
