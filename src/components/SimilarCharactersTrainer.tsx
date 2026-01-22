import { useState, useEffect, useCallback } from 'react';
import { useExercise } from '../contexts/ExerciseContext';
import type {
  SimilarCharactersDatabase,
  SimilarCharactersConfig,
  SimilarCharactersSession,
  SimilarCharactersScreen,
  SimilarCharactersAttempt,
  SimilarCharactersItem,
  MultipleChoiceItem,
  PairDistinctionItem,
} from '../types/similarCharacters';
import {
  loadSimilarCharactersDatabase,
  generateMultipleChoiceItems,
  generatePairDistinctionItems,
} from '../lib/similarCharactersLoader';
import {
  loadSimilarCharactersStats,
  saveSimilarCharactersStats,
  recordAttempts,
} from '../lib/similarCharactersStats';
import { SimilarCharactersSetup } from './SimilarCharactersSetup';
import { MultipleChoiceExercise } from './MultipleChoiceExercise';
import { PairDistinctionExercise } from './PairDistinctionExercise';
import { SimilarCharactersComplete } from './SimilarCharactersComplete';

interface SimilarCharactersTrainerProps {
  onBack: () => void;
}

export function SimilarCharactersTrainer({ onBack }: SimilarCharactersTrainerProps) {
  const { state } = useExercise();
  const [screen, setScreen] = useState<SimilarCharactersScreen>('setup');
  const [database, setDatabase] = useState<SimilarCharactersDatabase | null>(null);
  const [session, setSession] = useState<SimilarCharactersSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load database on mount
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const db = await loadSimilarCharactersDatabase();
        setDatabase(db);
        setError(null);
      } catch (err) {
        console.error('Failed to load similar characters database:', err);
        setError('Failed to load character data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Get vocabulary from context
  const vocabulary = state.vocabulary?.active || [];

  // Handle starting a session
  const handleStart = useCallback((config: SimilarCharactersConfig) => {
    if (!database) return;

    // Generate items based on mode
    let items: SimilarCharactersItem[];
    if (config.mode === 'multiple-choice') {
      items = generateMultipleChoiceItems(database, vocabulary, config);
    } else {
      items = generatePairDistinctionItems(database, vocabulary, config);
    }

    if (items.length === 0) {
      setError('No items available for practice with current settings.');
      return;
    }

    // Create session
    const newSession: SimilarCharactersSession = {
      config,
      startTime: Date.now(),
      items,
      attempts: [],
      currentIndex: 0,
    };

    setSession(newSession);
    setScreen('exercise');
  }, [database, vocabulary]);

  // Handle answer submission
  const handleAnswer = useCallback((
    selectedCharacter: string,
    wasCorrect: boolean,
    responseTimeMs: number
  ) => {
    if (!session) return;

    const currentItem = session.items[session.currentIndex];

    const attempt: SimilarCharactersAttempt = {
      itemId: currentItem.id,
      selectedCharacter,
      correctCharacter: session.config.mode === 'multiple-choice'
        ? (currentItem as MultipleChoiceItem).targetCharacter
        : (currentItem as PairDistinctionItem).targetCharacter,
      wasCorrect,
      responseTimeMs,
      timestamp: Date.now(),
    };

    setSession(prev => prev ? {
      ...prev,
      attempts: [...prev.attempts, attempt],
    } : null);
  }, [session]);

  // Handle moving to next item
  const handleNext = useCallback(() => {
    setSession(prev => prev ? {
      ...prev,
      currentIndex: prev.currentIndex + 1,
    } : null);
  }, []);

  // Handle ending session
  const handleEnd = useCallback(() => {
    if (!session) return;

    // Save statistics
    const stats = loadSimilarCharactersStats();
    const attemptRecords = session.attempts.map(attempt => {
      const item = session.items.find(i => i.id === attempt.itemId);
      let characterA: string, characterB: string;

      if (session.config.mode === 'multiple-choice') {
        // For multiple choice, pair is target vs selected
        characterA = attempt.correctCharacter;
        characterB = attempt.selectedCharacter !== attempt.correctCharacter
          ? attempt.selectedCharacter
          : attempt.correctCharacter;
      } else {
        // For pair distinction, use the actual pair
        const pdItem = item as PairDistinctionItem;
        characterA = pdItem.characterA;
        characterB = pdItem.characterB;
      }

      return { attempt, characterA, characterB };
    });

    const updatedStats = recordAttempts(stats, attemptRecords);
    saveSimilarCharactersStats(updatedStats);

    setScreen('complete');
  }, [session]);

  // Handle practice again
  const handlePracticeAgain = useCallback(() => {
    setSession(null);
    setScreen('setup');
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-teal-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading character data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !database) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-teal-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">
            {error || 'Failed to load character data.'}
          </p>
          <button
            onClick={onBack}
            className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  // No vocabulary state
  if (vocabulary.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-teal-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Please load vocabulary first to practice similar characters.
          </p>
          <button
            onClick={onBack}
            className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  // Render based on screen state
  switch (screen) {
    case 'setup':
      return (
        <SimilarCharactersSetup
          database={database}
          vocabulary={vocabulary}
          onStart={handleStart}
          onBack={onBack}
        />
      );

    case 'exercise':
      if (!session) return null;

      if (session.config.mode === 'multiple-choice') {
        return (
          <MultipleChoiceExercise
            items={session.items as MultipleChoiceItem[]}
            config={session.config}
            currentIndex={session.currentIndex}
            onAnswer={handleAnswer}
            onNext={handleNext}
            onEnd={handleEnd}
          />
        );
      } else {
        return (
          <PairDistinctionExercise
            items={session.items as PairDistinctionItem[]}
            config={session.config}
            currentIndex={session.currentIndex}
            onAnswer={handleAnswer}
            onNext={handleNext}
            onEnd={handleEnd}
          />
        );
      }

    case 'complete':
      if (!session) return null;
      return (
        <SimilarCharactersComplete
          session={session}
          onPracticeAgain={handlePracticeAgain}
          onBackToMenu={onBack}
        />
      );

    default:
      return null;
  }
}
