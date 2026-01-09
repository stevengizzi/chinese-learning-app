import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { VocabularyData } from '../types/vocabulary';
import type { Exercise, ExerciseAttempt, ExerciseType, PlayMode } from '../types/exercise';
import type { Session } from '../types/session';
import { generateExercise, shuffleArray } from '../lib/exerciseGenerator';
import { gradeAnswer } from '../lib/pinyinGrader';
import { gradeEnglishAnswer } from '../lib/englishGrader';
import { generateSessionStatistics } from '../lib/reportGenerator';

type Screen = 'menu' | 'exercise' | 'feedback' | 'report' | 'view-vocabulary' | 'tone-sequence';

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
  | { type: 'VIEW_VOCABULARY' }
  | { type: 'START_TONE_SEQUENCE' }
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

  const now = Date.now();
  return {
    id: `session-${Date.now()}`,
    exerciseType,
    playMode,
    startTime: now,
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
    remainingWords,
    accumulatedTimeMs: 0,
    lastResumeTime: now  // Timer starts immediately
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

      // Create remaining words list based on exercise type
      let remainingWords: string[] | undefined;
      if (playMode === 'complete-all' || playMode === 'drill') {
        if (exerciseType === 'shuffled') {
          // Create array with both word and meaning for each vocabulary entry
          const allEntries = state.vocabulary.active.flatMap(v => [v.word, v.meaning]);
          remainingWords = shuffleArray(allEntries);
        } else if (exerciseType === 'shuffled-to-english') {
          // Create array with both word and pinyin for each vocabulary entry
          const allEntries = state.vocabulary.active.flatMap(v => [v.word, v.pinyin]);
          remainingWords = shuffleArray(allEntries);
        } else if (exerciseType === 'english-to-pinyin') {
          // For English → Pinyin, use meanings as prompts
          remainingWords = shuffleArray(state.vocabulary.active.map(v => v.meaning));
        } else if (exerciseType === 'pinyin-to-english') {
          // For Pinyin → English, use pinyin as prompts
          remainingWords = shuffleArray(state.vocabulary.active.map(v => v.pinyin));
        } else {
          // For character-based exercises (character-to-pinyin, character-to-english)
          remainingWords = shuffleArray(state.vocabulary.active.map(v => v.word));
        }
      }

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

      // Use appropriate grader based on exercise type
      const isEnglishExercise = state.currentExercise.type.endsWith('-english');
      const attempt = isEnglishExercise
        ? gradeEnglishAnswer(
            action.payload,
            state.currentExercise.correctMeaning || '',
            state.currentExercise.prompt,
            state.currentExercise.id
          )
        : gradeAnswer(
            action.payload,
            state.currentExercise.correctPinyin || '',
            state.currentExercise.prompt,
            state.currentExercise.id
          );

      const updatedAttempts = [...state.currentSession.attempts, attempt];
      const currentTime = Date.now();

      // Accumulate time: add time since last resume to accumulated time, then pause
      const timeElapsedSinceResume = state.currentSession.lastResumeTime
        ? currentTime - state.currentSession.lastResumeTime
        : 0;
      const newAccumulatedTime = (state.currentSession.accumulatedTimeMs || 0) + timeElapsedSinceResume;

      const updatedStatistics = generateSessionStatistics(
        updatedAttempts,
        state.currentSession.startTime,
        currentTime,
        newAccumulatedTime
      );

      // Handle remaining words based on play mode
      let updatedRemainingWords = state.currentSession.remainingWords;
      const currentWord = state.currentExercise.words[0].word;

      if (state.currentSession.playMode === 'complete-all' && updatedRemainingWords) {
        // Remove current word (always move forward)
        updatedRemainingWords = updatedRemainingWords.slice(1);
      } else if (state.currentSession.playMode === 'drill' && updatedRemainingWords) {
        // Remove current word first
        updatedRemainingWords = updatedRemainingWords.slice(1);

        // If answer was incorrect, shuffle it back into the remaining words
        if (attempt.score.correct !== attempt.score.total) {
          const insertPosition = Math.floor(Math.random() * (updatedRemainingWords.length + 1));
          updatedRemainingWords = [
            ...updatedRemainingWords.slice(0, insertPosition),
            currentWord,
            ...updatedRemainingWords.slice(insertPosition)
          ];
        }
      }

      const updatedSession: Session = {
        ...state.currentSession,
        attempts: updatedAttempts,
        statistics: updatedStatistics,
        remainingWords: updatedRemainingWords,
        endTime: currentTime,
        accumulatedTimeMs: newAccumulatedTime,
        lastResumeTime: undefined  // Pause timer during feedback
      };

      // If complete-all or drill mode and no more words, go to report
      if ((state.currentSession.playMode === 'complete-all' || state.currentSession.playMode === 'drill') && updatedRemainingWords?.length === 0) {
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

      // Resume timer
      const resumeTime = Date.now();

      return {
        ...state,
        currentExercise: exercise,
        currentAttempt: null,
        currentSession: {
          ...state.currentSession,
          lastResumeTime: resumeTime  // Resume timer when starting next exercise
        },
        screen: 'exercise'
      };
    }

    case 'REQUEST_REPORT': {
      if (!state.currentSession) return state;

      const endTime = Date.now();

      // Calculate final accumulated time (add time since last resume if timer is running)
      const timeElapsedSinceResume = state.currentSession.lastResumeTime
        ? endTime - state.currentSession.lastResumeTime
        : 0;
      const finalAccumulatedTime = (state.currentSession.accumulatedTimeMs || 0) + timeElapsedSinceResume;

      const updatedStatistics = generateSessionStatistics(
        state.currentSession.attempts,
        state.currentSession.startTime,
        endTime,
        finalAccumulatedTime
      );

      return {
        ...state,
        currentSession: {
          ...state.currentSession,
          endTime,
          accumulatedTimeMs: finalAccumulatedTime,
          lastResumeTime: undefined,  // Pause timer
          statistics: updatedStatistics
        },
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

    case 'VIEW_VOCABULARY': {
      return {
        ...state,
        screen: 'view-vocabulary'
      };
    }

    case 'START_TONE_SEQUENCE': {
      return {
        ...state,
        screen: 'tone-sequence'
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
