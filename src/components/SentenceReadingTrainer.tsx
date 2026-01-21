import { useState, useEffect } from 'react';
import type {
  SentenceReadingConfig,
  SentenceReadingSession,
  SentenceReadingState,
  SentenceAttempt,
} from '../types/sentenceReading';
import { loadSentences, filterSentencesByDifficulty, shuffleSentences } from '../lib/sentenceParser';
import { SentenceReadingSetup } from './SentenceReadingSetup';
import { SentenceReadingExercise } from './SentenceReadingExercise';
import { SentenceReadingReport } from './SentenceReadingReport';

interface SentenceReadingTrainerProps {
  onBack: () => void;
}

export function SentenceReadingTrainer({ onBack }: SentenceReadingTrainerProps) {
  const [state, setState] = useState<SentenceReadingState>({
    config: null,
    currentSession: null,
    currentSentence: null,
    sentences: [],
    screen: 'setup',
  });

  const [isLoading, setIsLoading] = useState(true);

  // Load sentences on mount
  useEffect(() => {
    loadSentences().then(sentences => {
      setState(prev => ({ ...prev, sentences }));
      setIsLoading(false);
    });
  }, []);

  const handleStartExercise = (config: SentenceReadingConfig) => {
    // Filter sentences by difficulty
    const filtered = filterSentencesByDifficulty(
      state.sentences,
      config.difficultyRange[0],
      config.difficultyRange[1]
    );

    // Shuffle for random order
    const shuffled = shuffleSentences(filtered);
    const sentenceOrder = shuffled.map(s => s.id);

    const session: SentenceReadingSession = {
      id: `sentence-reading-${Date.now()}`,
      config,
      startTime: Date.now(),
      attempts: [],
      currentIndex: 0,
      sentenceOrder,
    };

    setState({
      ...state,
      config,
      currentSession: session,
      currentSentence: shuffled[0] || null,
      screen: 'exercise',
    });
  };

  const handleSubmitAttempt = (attempt: SentenceAttempt) => {
    if (!state.currentSession) return;

    const updatedAttempts = [...state.currentSession.attempts, attempt];
    const nextIndex = state.currentSession.currentIndex + 1;

    // Check if we've completed all sentences
    if (nextIndex >= state.currentSession.sentenceOrder.length) {
      // Session complete - go to report
      setState({
        ...state,
        currentSession: {
          ...state.currentSession,
          attempts: updatedAttempts,
          endTime: Date.now(),
        },
        screen: 'report',
      });
    } else {
      // Move to next sentence
      const nextSentenceId = state.currentSession.sentenceOrder[nextIndex];
      const nextSentence = state.sentences.find(s => s.id === nextSentenceId) || null;

      setState({
        ...state,
        currentSession: {
          ...state.currentSession,
          attempts: updatedAttempts,
          currentIndex: nextIndex,
        },
        currentSentence: nextSentence,
      });
    }
  };

  const handleEndSession = () => {
    if (!state.currentSession) {
      onBack();
      return;
    }

    // End early - go to report with current progress
    setState({
      ...state,
      currentSession: {
        ...state.currentSession,
        endTime: Date.now(),
      },
      screen: 'report',
    });
  };

  const handleNewSession = () => {
    setState({
      ...state,
      config: null,
      currentSession: null,
      currentSentence: null,
      screen: 'setup',
    });
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
          <div className="text-gray-600 dark:text-gray-300 text-lg">Loading sentences...</div>
        </div>
      </div>
    );
  }

  // Render appropriate screen based on state
  switch (state.screen) {
    case 'setup':
      return (
        <SentenceReadingSetup
          sentences={state.sentences}
          onStart={handleStartExercise}
          onBack={onBack}
        />
      );

    case 'exercise':
      if (!state.currentSession || !state.currentSentence) {
        return null;
      }
      return (
        <SentenceReadingExercise
          sentence={state.currentSentence}
          session={state.currentSession}
          onSubmitAttempt={handleSubmitAttempt}
          onEnd={handleEndSession}
        />
      );

    case 'report':
      if (!state.currentSession) {
        return null;
      }
      return (
        <SentenceReadingReport
          session={state.currentSession}
          onBackToMenu={onBack}
          onNewSession={handleNewSession}
        />
      );

    default:
      return null;
  }
}
