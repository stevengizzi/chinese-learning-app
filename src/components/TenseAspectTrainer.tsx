import { useState, useEffect } from 'react';
import type {
  TenseAspectConfig,
  TenseAspectSession,
  TenseAspectState,
  TenseAspectAttempt,
} from '../types/tenseAspect';
import { loadTenseAspectItems, filterByAspectTypes, shuffleItems } from '../lib/tenseAspectParser';
import { TenseAspectSetup } from './TenseAspectSetup';
import { TenseAspectExercise } from './TenseAspectExercise';
import { TenseAspectReport } from './TenseAspectReport';

interface TenseAspectTrainerProps {
  onBack: () => void;
}

export function TenseAspectTrainer({ onBack }: TenseAspectTrainerProps) {
  const [state, setState] = useState<TenseAspectState>({
    config: null,
    currentSession: null,
    currentItem: null,
    items: [],
    screen: 'setup',
  });

  const [isLoading, setIsLoading] = useState(true);

  // Load items on mount
  useEffect(() => {
    loadTenseAspectItems().then(items => {
      setState(prev => ({ ...prev, items }));
      setIsLoading(false);
    });
  }, []);

  const handleStartExercise = (config: TenseAspectConfig) => {
    // Filter items by selected aspects
    const filtered = filterByAspectTypes(state.items, config.selectedAspects);

    // Shuffle if configured
    const ordered = config.shuffle ? shuffleItems(filtered) : filtered;
    const itemOrder = ordered.map(item => item.id);

    const session: TenseAspectSession = {
      id: `tense-aspect-${Date.now()}`,
      config,
      startTime: Date.now(),
      attempts: [],
      currentIndex: 0,
      itemOrder,
    };

    setState({
      ...state,
      config,
      currentSession: session,
      currentItem: ordered[0] || null,
      screen: 'exercise',
    });
  };

  const handleSubmitAttempt = (attempt: TenseAspectAttempt) => {
    if (!state.currentSession) return;

    const updatedAttempts = [...state.currentSession.attempts, attempt];
    const nextIndex = state.currentSession.currentIndex + 1;

    // Check if we've completed all items
    if (nextIndex >= state.currentSession.itemOrder.length) {
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
      // Move to next item
      const nextItemId = state.currentSession.itemOrder[nextIndex];
      const nextItem = state.items.find(item => item.id === nextItemId) || null;

      setState({
        ...state,
        currentSession: {
          ...state.currentSession,
          attempts: updatedAttempts,
          currentIndex: nextIndex,
        },
        currentItem: nextItem,
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
      currentItem: null,
      screen: 'setup',
    });
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <div className="text-gray-600 dark:text-gray-300 text-lg">Loading tense/aspect corpus...</div>
        </div>
      </div>
    );
  }

  // Render appropriate screen based on state
  switch (state.screen) {
    case 'setup':
      return (
        <TenseAspectSetup
          items={state.items}
          onStart={handleStartExercise}
          onBack={onBack}
        />
      );

    case 'exercise':
      if (!state.currentSession || !state.currentItem) {
        return null;
      }
      return (
        <TenseAspectExercise
          item={state.currentItem}
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
        <TenseAspectReport
          session={state.currentSession}
          items={state.items}
          onBackToMenu={onBack}
          onNewSession={handleNewSession}
        />
      );

    default:
      return null;
  }
}
