import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { VocabularyData } from '../types/vocabulary';
import type { Exercise, ExerciseAttempt, ExerciseType, PlayMode } from '../types/exercise';
import type { Session } from '../types/session';
import { generateExercise, shuffleArray } from '../lib/exerciseGenerator';
import { gradeAnswer } from '../lib/pinyinGrader';
import { generateSessionStatistics } from '../lib/reportGenerator';

type Screen = 'menu' | 'exercise' | 'feedback' | 'report';

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
  | { type: 'START_SESSION_WITH_CONFIG'; payload: { exerciseType: ExerciseType; playMode: PlayMode } }
  | { type: 'SUBMIT_ANSWER'; payload: string }
  | { type: 'NEXT_EXERCISE' }
  | { type: 'REQUEST_REPORT' }
  | { type: 'BACK_TO_MENU' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'FINISH_LOADING' };

const initialState: ExerciseState = {
  vocabulary: null,
  currentSession: null,
  currentExercise: null,
  currentAttempt: null,
  screen: 'menu',
  isLoading: true,
  error: null
};

function generateNewExercise(
  vocabulary: VocabularyData,
  exerciseType: ExerciseType,
  playMode: PlayMode,
  recentIds: string[],
  remainingWords: string[]
): Exercise {
  return generateExercise(vocabulary.active, exerciseType, playMode, recentIds, remainingWords);
}

function createNewSession(exerciseType: ExerciseType, playMode: PlayMode, vocabularySize: number): Session {
  const remainingWords = playMode === 'complete-all'
    ? shuffleArray(Array.from({ length: vocabularySize }, (_, i) => i.toString()))
    : undefined;

  return {
    id: `session-${Date.now()}`,
    exerciseType,
    playMode,
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
    },
    remainingWords
  };
}

function exerciseReducer(state: ExerciseState, action: ExerciseAction): ExerciseState {
  switch (action.type) {
    case 'SET_VOCABULARY': {
      const vocabulary = action.payload;

      return {
        ...state,
        vocabulary,
        isLoading: false,
        screen: 'menu'
      };
    }

    case 'START_SESSION_WITH_CONFIG': {
      if (!state.vocabulary) return state;

      const { exerciseType, playMode } = action.payload;
      const vocabularyWords = state.vocabulary.active.map(v => v.word);
      const remainingWords = playMode === 'complete-all'
        ? shuffleArray(vocabularyWords)
        : undefined;

      const session = createNewSession(exerciseType, playMode, state.vocabulary.active.length);
      session.remainingWords = remainingWords;

      const exercise = generateNewExercise(
        state.vocabulary,
        exerciseType,
        playMode,
        [],
        remainingWords || []
      );

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
        state.currentExercise.prompt,
        state.currentExercise.id
      );

      const updatedAttempts = [...state.currentSession.attempts, attempt];
      const updatedStatistics = generateSessionStatistics(updatedAttempts);

      // Remove current word from remaining words in complete-all mode
      let updatedRemainingWords = state.currentSession.remainingWords;
      if (state.currentSession.playMode === 'complete-all' && updatedRemainingWords) {
        updatedRemainingWords = updatedRemainingWords.slice(1);
      }

      const updatedSession: Session = {
        ...state.currentSession,
        attempts: updatedAttempts,
        statistics: updatedStatistics,
        remainingWords: updatedRemainingWords
      };

      // If complete-all mode and no more words, go to report
      if (state.currentSession.playMode === 'complete-all' && updatedRemainingWords?.length === 0) {
        return {
          ...state,
          currentSession: updatedSession,
          currentAttempt: attempt,
          screen: 'report'
        };
      }

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

      const exercise = generateNewExercise(
        state.vocabulary,
        state.currentSession.exerciseType,
        state.currentSession.playMode,
        recentIds,
        state.currentSession.remainingWords || []
      );

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

    case 'BACK_TO_MENU': {
      return {
        ...state,
        currentSession: null,
        currentExercise: null,
        currentAttempt: null,
        screen: 'menu'
      };
    }

    case 'SET_ERROR': {
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
    }

    case 'FINISH_LOADING': {
      return {
        ...state,
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
