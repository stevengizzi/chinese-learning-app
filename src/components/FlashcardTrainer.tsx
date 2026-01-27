import { useState, useCallback, useMemo } from 'react';
import { useExercise } from '../contexts/ExerciseContext';
import type { VocabularyEntry } from '../types/vocabulary';
import type { PlayMode } from '../types/exercise';
import type {
  FlashcardConfig,
  FlashcardAttempt,
  FlashcardSessionState,
} from '../types/flashcard';
import { FlashcardSetup } from './FlashcardSetup';
import { FlashcardExercise } from './FlashcardExercise';
import { FlashcardReport } from './FlashcardReport';
import { generateVocabularyId } from '../lib/responseTracking/storage';

type FlashcardScreen = 'setup' | 'exercise' | 'report';

interface FlashcardTrainerProps {
  onBack: () => void;
  initialPlayMode?: PlayMode;
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function FlashcardTrainer({ onBack, initialPlayMode }: FlashcardTrainerProps) {
  const { state, dispatch } = useExercise();
  const [screen, setScreen] = useState<FlashcardScreen>('setup');
  const [session, setSession] = useState<FlashcardSessionState | null>(null);
  const [vocabulary, setVocabulary] = useState<VocabularyEntry[]>([]);

  const handleStartExercise = useCallback((config: FlashcardConfig, filteredVocab: VocabularyEntry[]) => {
    const shuffled = shuffleArray(filteredVocab);
    const indices = shuffled.map((_, i) => i);

    setVocabulary(shuffled);
    setSession({
      config,
      attempts: [],
      currentIndex: 0,
      isFlipped: false,
      flipTimestamp: null,
      showTimestamp: Date.now(),
      remainingItems: config.playMode === 'drill' ? [...indices] : indices,
      completedItems: new Set(),
    });
    setScreen('exercise');
  }, []);

  const handleFlip = useCallback(() => {
    if (!session) return;
    setSession({
      ...session,
      isFlipped: true,
      flipTimestamp: Date.now(),
    });
  }, [session]);

  const handleAnswer = useCallback((correct: boolean) => {
    if (!session || session.currentIndex >= vocabulary.length) return;

    const currentVocab = vocabulary[session.remainingItems[session.currentIndex]];
    const vocabId = generateVocabularyId(currentVocab.word, currentVocab.pinyin, currentVocab.meaning);

    const attempt: FlashcardAttempt = {
      vocabId,
      word: currentVocab.word,
      pinyin: currentVocab.pinyin,
      meaning: currentVocab.meaning,
      correct,
      timeToFlip: session.flipTimestamp ? session.flipTimestamp - session.showTimestamp : 0,
      timeToAnswer: Date.now() - (session.flipTimestamp || session.showTimestamp),
    };

    const updatedAttempts = [...session.attempts, attempt];
    let newRemainingItems = [...session.remainingItems];
    let newCompletedItems = new Set(session.completedItems);
    let nextIndex = session.currentIndex;

    const { playMode } = session.config;

    if (playMode === 'drill') {
      // Drill mode: if correct, remove from remaining; if wrong, move to end
      if (correct) {
        newRemainingItems.splice(session.currentIndex, 1);
        newCompletedItems.add(vocabId);
        // Don't increment index since we removed the current item
      } else {
        // Move current item to the end
        const item = newRemainingItems.splice(session.currentIndex, 1)[0];
        newRemainingItems.push(item);
        // Don't increment index since we removed and re-added
      }

      // Check if done
      if (newRemainingItems.length === 0) {
        setSession({
          ...session,
          attempts: updatedAttempts,
          completedItems: newCompletedItems,
          remainingItems: newRemainingItems,
        });
        setScreen('report');
        return;
      }
    } else if (playMode === 'complete-all') {
      // Complete-all: go through each once
      newCompletedItems.add(vocabId);
      nextIndex = session.currentIndex + 1;

      if (nextIndex >= newRemainingItems.length) {
        setSession({
          ...session,
          attempts: updatedAttempts,
          completedItems: newCompletedItems,
          currentIndex: nextIndex,
        });
        setScreen('report');
        return;
      }
    } else if (playMode === 'endless') {
      // Endless: just keep cycling
      nextIndex = (session.currentIndex + 1) % newRemainingItems.length;
    } else if (playMode === 'speed-drill') {
      // Speed drill: similar to drill but with time tracking
      // For now, treat like drill mode
      if (correct) {
        newRemainingItems.splice(session.currentIndex, 1);
        newCompletedItems.add(vocabId);
      } else {
        const item = newRemainingItems.splice(session.currentIndex, 1)[0];
        newRemainingItems.push(item);
      }

      if (newRemainingItems.length === 0) {
        setSession({
          ...session,
          attempts: updatedAttempts,
          completedItems: newCompletedItems,
          remainingItems: newRemainingItems,
        });
        setScreen('report');
        return;
      }
    }

    // Move to next card
    setSession({
      ...session,
      attempts: updatedAttempts,
      currentIndex: nextIndex,
      isFlipped: false,
      flipTimestamp: null,
      showTimestamp: Date.now(),
      remainingItems: newRemainingItems,
      completedItems: newCompletedItems,
    });
  }, [session, vocabulary]);

  const handleEndSession = useCallback(() => {
    if (session && session.attempts.length > 0) {
      setScreen('report');
    } else {
      onBack();
    }
  }, [session, onBack]);

  const handleNewSession = useCallback(() => {
    setSession(null);
    setVocabulary([]);
    setScreen('setup');
  }, []);

  // Get current vocabulary item index (in local vocabulary array)
  const currentVocabIndex = useMemo(() => {
    if (!session || vocabulary.length === 0 || session.remainingItems.length === 0) return -1;
    return session.remainingItems[session.currentIndex % session.remainingItems.length];
  }, [session, vocabulary.length]);

  // Get current vocabulary item
  const getCurrentVocab = (): VocabularyEntry | null => {
    if (currentVocabIndex < 0) return null;
    return vocabulary[currentVocabIndex] || null;
  };

  // Handle editing vocabulary during flashcard exercise
  const handleEditVocab = useCallback((field: 'word' | 'pinyin' | 'meaning', value: string) => {
    if (currentVocabIndex < 0 || !state.vocabulary) return;

    const currentVocab = vocabulary[currentVocabIndex];
    if (!currentVocab) return;

    // Update local vocabulary state
    const updatedVocabulary = [...vocabulary];
    updatedVocabulary[currentVocabIndex] = {
      ...currentVocab,
      [field]: value,
    };
    setVocabulary(updatedVocabulary);

    // Find the corresponding entry in the global vocabulary and update it
    const globalIndex = state.vocabulary.active.findIndex(
      v => v.word === currentVocab.word &&
           v.pinyin === currentVocab.pinyin &&
           v.meaning === currentVocab.meaning
    );

    if (globalIndex !== -1) {
      dispatch({
        type: 'UPDATE_VOCABULARY_ENTRY',
        payload: {
          index: globalIndex,
          updates: { [field]: value },
        },
      });
    }
  }, [currentVocabIndex, vocabulary, state.vocabulary, dispatch]);

  switch (screen) {
    case 'setup':
      return (
        <FlashcardSetup
          vocabulary={state.vocabulary?.active || []}
          database={state.responseDatabase}
          onStart={handleStartExercise}
          onBack={onBack}
          initialPlayMode={initialPlayMode}
        />
      );

    case 'exercise':
      const currentVocab = getCurrentVocab();
      if (!session || !currentVocab) return null;
      return (
        <FlashcardExercise
          vocab={currentVocab}
          config={session.config}
          isFlipped={session.isFlipped}
          onFlip={handleFlip}
          onAnswer={handleAnswer}
          onEnd={handleEndSession}
          onEditVocab={handleEditVocab}
          progress={{
            current: session.config.playMode === 'endless'
              ? session.attempts.length + 1
              : session.completedItems.size + 1,
            total: session.config.playMode === 'endless'
              ? undefined
              : vocabulary.length,
            remaining: session.remainingItems.length,
          }}
        />
      );

    case 'report':
      if (!session) return null;
      return (
        <FlashcardReport
          attempts={session.attempts}
          config={session.config}
          onBackToMenu={onBack}
          onNewSession={handleNewSession}
        />
      );

    default:
      return null;
  }
}
