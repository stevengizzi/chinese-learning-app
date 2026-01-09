import { useState } from 'react';
import type { ToneSequenceConfig, ToneSequenceSession, ToneSequenceState } from '../types/toneSequence';
import { ToneSequenceSetup } from './ToneSequenceSetup';
import { ToneSequenceExercise } from './ToneSequenceExercise';
import { ToneSequenceReport } from './ToneSequenceReport';

interface ToneSequenceTrainerProps {
  onBack: () => void;
}

export function ToneSequenceTrainer({ onBack }: ToneSequenceTrainerProps) {
  const [state, setState] = useState<ToneSequenceState>({
    config: null,
    currentSession: null,
    currentSequence: null,
    screen: 'setup',
  });

  const handleStartExercise = (config: ToneSequenceConfig) => {
    const session: ToneSequenceSession = {
      id: `tone-seq-${Date.now()}`,
      config,
      startTime: Date.now(),
      sequencesCompleted: 0,
    };

    setState({
      config,
      currentSession: session,
      currentSequence: null,
      screen: 'exercise',
    });
  };

  const handleConfigChange = (config: ToneSequenceConfig) => {
    if (state.currentSession) {
      setState({
        ...state,
        config,
        currentSession: {
          ...state.currentSession,
          config,
        },
      });
    }
  };

  const handleEndExercise = (sequencesCompleted: number) => {
    if (state.currentSession) {
      const endedSession: ToneSequenceSession = {
        ...state.currentSession,
        endTime: Date.now(),
        sequencesCompleted,
      };

      setState({
        ...state,
        currentSession: endedSession,
        screen: 'report',
      });
    }
  };

  const handleNewSession = () => {
    setState({
      config: null,
      currentSession: null,
      currentSequence: null,
      screen: 'setup',
    });
  };

  // Render appropriate screen based on state
  switch (state.screen) {
    case 'setup':
      return <ToneSequenceSetup onStart={handleStartExercise} onBack={onBack} />;

    case 'exercise':
      if (!state.config || !state.currentSession) {
        return null; // Should not happen
      }
      return (
        <ToneSequenceExercise
          config={state.config}
          onConfigChange={handleConfigChange}
          onEnd={handleEndExercise}
        />
      );

    case 'report':
      if (!state.currentSession) {
        return null; // Should not happen
      }
      return (
        <ToneSequenceReport
          session={state.currentSession}
          onBackToMenu={onBack}
          onNewSession={handleNewSession}
        />
      );

    default:
      return null;
  }
}
