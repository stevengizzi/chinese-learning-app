import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { VocabularyData } from '../types/vocabulary';
import type { Exercise, ExerciseAttempt } from '../types/exercise';
import type { Session } from '../types/session';
import { generateExercise } from '../lib/exerciseGenerator';
import { gradeAnswer } from '../lib/pinyinGrader';
import { generateSessionStatistics } from '../lib/reportGenerator';

type Screen = 'exercise' | 'feedback' | 'report';

interface ExerciseState {
  vocabulary: VocabularyData | null;
  currentSession: Session | null;
  currentExercise: Exercise | null;
  currentAttempt: ExerciseAttempt | null;
  screen: Screen;
  isLoading: boolean;
  error: string | null;
}

type ExerciseAction =
  | { type: 'SET_VOCABULARY'; payload: VocabularyData }
  | { type: 'START_SESSION' }
  | { type: 'SUBMIT_ANSWER'; payload: string }
  | { type: 'NEXT_EXERCISE' }
  | { type: 'REQUEST_REPORT' }
  | { type: 'NEW_SESSION' }
  | { type: 'SET_ERROR'; payload: string };

const initialState: ExerciseState = {
  vocabulary: null,
  currentSession: null,
  currentExercise: null,
  currentAttempt: null,
  screen: 'exercise',
  isLoading: true,
  error: null
};

function generateNewExercise(vocabulary: VocabularyData, recentIds: string[]): Exercise {
  return generateExercise(vocabulary.active, recentIds);
}

function createNewSession(): Session {
  return {
    id: `session-${Date.now()}`,
    startTime: Date.now(),
    attempts: [],
    statistics: {
      totalExercises: 0,
      totalCharacters: 0,
      correctCharacters: 0,
      averageAccuracy: 0,
      toneErrors: 0,
      syllableErrors: 0,
      commonMistakes: {}
    }
  };
}

function exerciseReducer(state: ExerciseState, action: ExerciseAction): ExerciseState {
  switch (action.type) {
    case 'SET_VOCABULARY': {
      const vocabulary = action.payload;
      const session = createNewSession();
      const recentIds: string[] = [];
      const exercise = generateNewExercise(vocabulary, recentIds);

      return {
        ...state,
        vocabulary,
        currentSession: session,
        currentExercise: exercise,
        isLoading: false,
        screen: 'exercise'
      };
    }

    case 'START_SESSION': {
      if (!state.vocabulary) return state;

      const session = createNewSession();
      const exercise = generateNewExercise(state.vocabulary, []);

      return {
        ...state,
        currentSession: session,
        currentExercise: exercise,
        currentAttempt: null,
        screen: 'exercise'
      };
    }

    case 'SUBMIT_ANSWER': {
      if (!state.currentExercise || !state.currentSession) return state;

      const attempt = gradeAnswer(
        action.payload,
        state.currentExercise.correctPinyin,
        state.currentExercise.sentence,
        state.currentExercise.id
      );

      const updatedAttempts = [...state.currentSession.attempts, attempt];
      const updatedStatistics = generateSessionStatistics(updatedAttempts);

      const updatedSession: Session = {
        ...state.currentSession,
        attempts: updatedAttempts,
        statistics: updatedStatistics
      };

      return {
        ...state,
        currentSession: updatedSession,
        currentAttempt: attempt,
        screen: 'feedback'
      };
    }

    case 'NEXT_EXERCISE': {
      if (!state.vocabulary || !state.currentSession) return state;

      // Get recent exercise IDs to avoid repetition
      const recentIds = state.currentSession.attempts
        .slice(-5)
        .map(a => a.exerciseId.split('-')[0]); // Extract word from exercise ID

      const exercise = generateNewExercise(state.vocabulary, recentIds);

      return {
        ...state,
        currentExercise: exercise,
        currentAttempt: null,
        screen: 'exercise'
      };
    }

    case 'REQUEST_REPORT': {
      return {
        ...state,
        screen: 'report'
      };
    }

    case 'NEW_SESSION': {
      if (!state.vocabulary) return state;

      const session = createNewSession();
      const exercise = generateNewExercise(state.vocabulary, []);

      return {
        ...state,
        currentSession: session,
        currentExercise: exercise,
        currentAttempt: null,
        screen: 'exercise'
      };
    }

    case 'SET_ERROR': {
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
    }

    default:
      return state;
  }
}

const ExerciseContext = createContext<{
  state: ExerciseState;
  dispatch: React.Dispatch<ExerciseAction>;
} | null>(null);

export function ExerciseProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(exerciseReducer, initialState);

  // Save session to localStorage whenever it updates
  useEffect(() => {
    if (state.currentSession && state.currentSession.attempts.length > 0) {
      localStorage.setItem('currentSession', JSON.stringify(state.currentSession));
    }
  }, [state.currentSession]);

  // Save vocabulary to localStorage
  useEffect(() => {
    if (state.vocabulary) {
      localStorage.setItem('vocabulary', JSON.stringify(state.vocabulary));
    }
  }, [state.vocabulary]);

  return (
    <ExerciseContext.Provider value={{ state, dispatch }}>
      {children}
    </ExerciseContext.Provider>
  );
}

export function useExercise() {
  const context = useContext(ExerciseContext);
  if (!context) {
    throw new Error('useExercise must be used within ExerciseProvider');
  }
  return context;
}
