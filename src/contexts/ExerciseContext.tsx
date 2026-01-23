import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { VocabularyData, VocabularyEntry } from '../types/vocabulary';
import type { Exercise, ExerciseAttempt, ExerciseType, PlayMode } from '../types/exercise';
import type { Session } from '../types/session';
import type { ResponseDatabase } from '../types/responseTracking';
import type { VocabularyFilterConfig } from '../types/vocabularyFilter';
import { generateExercise, shuffleArray } from '../lib/exerciseGenerator';
import { gradeAnswer } from '../lib/pinyinGrader';
import { gradeEnglishAnswer } from '../lib/englishGrader';
import { generateSessionStatistics } from '../lib/reportGenerator';
import { loadResponseDatabase, addResponseRecords, saveResponseDatabase, countWords } from '../lib/responseTracking/storage';
import { filterVocabulary } from '../lib/vocabularyFilter';

type Screen = 'menu' | 'exercise' | 'feedback' | 'report' | 'view-vocabulary' | 'tone-sequence' | 'speed-drill-config' | 'sentence-reading' | 'tone-pattern' | 'similar-characters' | 'exercise-config' | 'dashboard';

interface ExerciseState {
  vocabulary: VocabularyData | null;
  currentSession: Session | null;
  currentExercise: Exercise | null;
  currentAttempt: ExerciseAttempt | null;
  screen: Screen;
  isLoading: boolean;
  error: string | null;
  responseDatabase: ResponseDatabase | null;
  pendingSpeedDrillExercise?: ExerciseType; // Exercise type pending speed drill config
  pendingExerciseConfig?: { exerciseType: ExerciseType; playMode: PlayMode }; // Exercise pending config
  focusOnWeaknesses: boolean; // Whether to prioritize weak vocabulary items
}

type ExerciseAction =
  | { type: 'SET_VOCABULARY'; payload: VocabularyData }
  | { type: 'SET_RESPONSE_DATABASE'; payload: ResponseDatabase }
  | { type: 'SHOW_EXERCISE_CONFIG'; payload: { exerciseType: ExerciseType; playMode: PlayMode } }
  | { type: 'START_SESSION_WITH_CONFIG'; payload: { exerciseType: ExerciseType; playMode: PlayMode; vocabularyFilter?: VocabularyFilterConfig } }
  | { type: 'SHOW_SPEED_DRILL_CONFIG'; payload: { exerciseType: ExerciseType } }
  | { type: 'START_SPEED_DRILL'; payload: { exerciseType: ExerciseType; baseThresholdMs: number; incrementPerWordMs: number; vocabularyFilter?: VocabularyFilterConfig } }
  | { type: 'SUBMIT_ANSWER'; payload: string }
  | { type: 'NEXT_EXERCISE' }
  | { type: 'REQUEST_REPORT' }
  | { type: 'BACK_TO_MENU' }
  | { type: 'VIEW_VOCABULARY' }
  | { type: 'START_TONE_SEQUENCE' }
  | { type: 'START_SENTENCE_READING' }
  | { type: 'START_TONE_PATTERN' }
  | { type: 'START_SIMILAR_CHARACTERS' }
  | { type: 'VIEW_DASHBOARD' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'FINISH_LOADING' }
  | { type: 'SET_FOCUS_MODE'; payload: boolean };

// Load saved focus mode preference from localStorage
function loadFocusModePreference(): boolean {
  try {
    const saved = localStorage.getItem('focusOnWeaknesses');
    return saved ? JSON.parse(saved) : false;
  } catch {
    return false;
  }
}

const initialState: ExerciseState = {
  vocabulary: null,
  currentSession: null,
  currentExercise: null,
  currentAttempt: null,
  screen: 'menu',
  isLoading: true,
  error: null,
  responseDatabase: null,
  focusOnWeaknesses: loadFocusModePreference()
};

function generateNewExercise(
  vocabulary: VocabularyData,
  exerciseType: ExerciseType,
  playMode: PlayMode,
  recentIds: string[],
  remainingWords: string[],
  focusOnWeaknesses: boolean = false,
  responseDatabase: ResponseDatabase | null = null
): Exercise {
  // Build focus mode options if enabled and we have a response database
  const focusMode = focusOnWeaknesses && responseDatabase
    ? { enabled: true, responseDatabase }
    : undefined;

  return generateExercise(
    vocabulary.active,
    exerciseType,
    playMode,
    recentIds,
    remainingWords,
    focusMode
  );
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
    lastResumeTime: now,  // Timer starts immediately
    exerciseStartTime: now,  // Start timing first exercise
    responseTimings: []
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

    case 'SET_RESPONSE_DATABASE': {
      return {
        ...state,
        responseDatabase: action.payload
      };
    }

    case 'START_SESSION_WITH_CONFIG': {
      if (!state.vocabulary) return state;

      const { exerciseType, playMode, vocabularyFilter } = action.payload;

      // Apply vocabulary filter if specified
      const activeVocabulary: VocabularyEntry[] = vocabularyFilter && vocabularyFilter.type !== 'all'
        ? filterVocabulary(state.vocabulary.active, vocabularyFilter, state.responseDatabase)
        : state.vocabulary.active;

      // If filter results in empty vocabulary, return error state
      if (activeVocabulary.length === 0) {
        return {
          ...state,
          error: 'No vocabulary items match the selected filter. Try a different filter or add more vocabulary.'
        };
      }

      // Create remaining words list based on exercise type and play mode
      let remainingWords: string[] | undefined;

      if (playMode === 'complete-all' || playMode === 'drill' || playMode === 'speed-drill') {
        // All these modes work through all vocabulary prompts
        if (exerciseType === 'shuffled') {
          // Create array with both word and meaning for each vocabulary entry
          const allEntries = activeVocabulary.flatMap(v => [v.word, v.meaning]);
          remainingWords = shuffleArray(allEntries);
        } else if (exerciseType === 'shuffled-to-english') {
          // Create array with both word and pinyin for each vocabulary entry
          const allEntries = activeVocabulary.flatMap(v => [v.word, v.pinyin]);
          remainingWords = shuffleArray(allEntries);
        } else if (exerciseType === 'english-to-pinyin') {
          // For English → Pinyin, use meanings as prompts
          remainingWords = shuffleArray(activeVocabulary.map(v => v.meaning));
        } else if (exerciseType === 'pinyin-to-english') {
          // For Pinyin → English, use pinyin as prompts
          remainingWords = shuffleArray(activeVocabulary.map(v => v.pinyin));
        } else {
          // For character-based exercises (character-to-pinyin, character-to-english)
          remainingWords = shuffleArray(activeVocabulary.map(v => v.word));
        }
      }

      const session = createNewSession(exerciseType, playMode, activeVocabulary.length);
      session.remainingWords = remainingWords;
      session.totalPrompts = remainingWords?.length; // Store initial total

      // Create a filtered vocabulary data object for the session
      const filteredVocabularyData: VocabularyData = {
        ...state.vocabulary,
        active: activeVocabulary
      };

      const exercise = generateNewExercise(
        filteredVocabularyData,
        exerciseType,
        playMode,
        [],
        remainingWords || [],
        state.focusOnWeaknesses,
        state.responseDatabase
      );

      return {
        ...state,
        currentSession: {
          ...session,
          focusOnWeaknesses: state.focusOnWeaknesses,  // Store in session for display
          vocabularyFilter,  // Store filter config in session
          filteredVocabulary: activeVocabulary  // Store filtered vocabulary for the session
        },
        currentExercise: exercise,
        currentAttempt: null,
        screen: 'exercise',
        error: null  // Clear any previous error
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

      // Calculate response time for this exercise
      const responseTimeMs = state.currentSession.exerciseStartTime
        ? currentTime - state.currentSession.exerciseStartTime
        : 0;

      // Record response timing
      const vocabEntry = state.currentExercise.words[0];
      const wasCorrect = attempt.score.correct === attempt.score.total;

      // Determine the correct answer to count words
      const correctAnswer = isEnglishExercise
        ? (state.currentExercise.correctMeaning || '')
        : (state.currentExercise.correctPinyin || '');
      const wordCount = countWords(correctAnswer);

      const newTiming = {
        vocabularyId: `${vocabEntry.word}:${vocabEntry.pinyin}:${vocabEntry.meaning}`,
        character: vocabEntry.word,
        pinyin: vocabEntry.pinyin,
        meaning: vocabEntry.meaning,
        promptType: state.currentExercise.promptType,
        responseTimeMs,
        wordCount,
        wasCorrect
      };
      const updatedResponseTimings = [...(state.currentSession.responseTimings || []), newTiming];

      // IMMEDIATELY save this response record to the database
      // This ensures no data is lost even if the user exits without requesting a report
      try {
        const cachedData = localStorage.getItem('response-tracking-cache');
        let db;
        if (cachedData) {
          try {
            db = JSON.parse(cachedData);
          } catch {
            db = { version: 1, records: [], statistics: {}, lastUpdated: Date.now() };
          }
        } else {
          db = { version: 1, records: [], statistics: {}, lastUpdated: Date.now() };
        }

        const record = {
          vocabularyId: newTiming.vocabularyId,
          character: newTiming.character,
          pinyin: newTiming.pinyin,
          meaning: newTiming.meaning,
          exerciseType: state.currentSession.exerciseType,
          promptType: newTiming.promptType,
          responseTimeMs: newTiming.responseTimeMs,
          wordCount: newTiming.wordCount,
          wasCorrect: newTiming.wasCorrect
        };

        const updatedDb = addResponseRecords(db, [record]);
        saveResponseDatabase(updatedDb);
      } catch (error) {
        console.error('Failed to save response record:', error);
      }

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

      // Use the ORIGINAL prompt from remainingWords[0], not the displayed prompt
      // This ensures we re-insert the exact same value that was in remainingWords
      // The displayed prompt may have disambiguation added (e.g., "哥哥 (older brother)")
      // but remainingWords contains the raw value (e.g., "哥哥" or "older brother")
      const originalPrompt = updatedRemainingWords?.[0] || state.currentExercise.prompt.split(' (')[0];

      if (state.currentSession.playMode === 'speed-drill' && updatedRemainingWords) {
        // For speed-drill: only remove if answer was correct AND meets threshold
        // Use session-specific thresholds if configured
        const config = state.currentSession.speedDrillConfig || { baseThresholdMs: 3000, incrementPerWordMs: 1000 };
        const threshold = config.baseThresholdMs + Math.max(0, wordCount - 1) * config.incrementPerWordMs;
        const perWordThreshold = wordCount > 0 ? threshold / wordCount : threshold;
        const perWordTime = wordCount > 0 ? responseTimeMs / wordCount : responseTimeMs;

        if (wasCorrect && perWordTime <= perWordThreshold) {
          // Met threshold - remove from training list
          updatedRemainingWords = updatedRemainingWords.slice(1);
        } else {
          // Didn't meet threshold or incorrect - keep in list but move to back
          updatedRemainingWords = updatedRemainingWords.slice(1);
          if (updatedRemainingWords.length > 0) {
            const insertPosition = Math.floor(Math.random() * updatedRemainingWords.length);
            updatedRemainingWords = [
              ...updatedRemainingWords.slice(0, insertPosition),
              originalPrompt,
              ...updatedRemainingWords.slice(insertPosition)
            ];
          } else {
            updatedRemainingWords = [originalPrompt];
          }
        }
      } else if (state.currentSession.playMode === 'complete-all' && updatedRemainingWords) {
        // Remove current prompt (always move forward)
        updatedRemainingWords = updatedRemainingWords.slice(1);
      } else if (state.currentSession.playMode === 'drill' && updatedRemainingWords) {
        // Remove current prompt first
        updatedRemainingWords = updatedRemainingWords.slice(1);

        // If answer was incorrect, shuffle it back into the remaining words
        if (attempt.score.correct !== attempt.score.total) {
          // Re-insert the ORIGINAL prompt value, ensuring it matches vocabulary fields
          const insertPosition = Math.floor(Math.random() * (updatedRemainingWords.length + 1));
          updatedRemainingWords = [
            ...updatedRemainingWords.slice(0, insertPosition),
            originalPrompt,
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
        lastResumeTime: undefined,  // Pause timer during feedback
        responseTimings: updatedResponseTimings
      };

      // If complete-all, drill, or speed-drill mode and no more words, go to report
      if ((state.currentSession.playMode === 'complete-all' || state.currentSession.playMode === 'drill' || state.currentSession.playMode === 'speed-drill') && updatedRemainingWords?.length === 0) {
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

      // Use filtered vocabulary if available, otherwise use full vocabulary
      const vocabularyToUse: VocabularyData = state.currentSession.filteredVocabulary
        ? { ...state.vocabulary, active: state.currentSession.filteredVocabulary }
        : state.vocabulary;

      const exercise = generateNewExercise(
        vocabularyToUse,
        state.currentSession.exerciseType,
        state.currentSession.playMode,
        recentIds,
        state.currentSession.remainingWords || [],
        state.currentSession.focusOnWeaknesses || false,
        state.responseDatabase
      );

      // Resume timer
      const resumeTime = Date.now();

      return {
        ...state,
        currentExercise: exercise,
        currentAttempt: null,
        currentSession: {
          ...state.currentSession,
          lastResumeTime: resumeTime,  // Resume timer when starting next exercise
          exerciseStartTime: resumeTime  // Start timing for new exercise
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

      // Response records are now saved incrementally after each answer (in SUBMIT_ANSWER)
      // No need to save them again here

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

    case 'SHOW_EXERCISE_CONFIG': {
      return {
        ...state,
        pendingExerciseConfig: action.payload,
        screen: 'exercise-config'
      };
    }

    case 'SHOW_SPEED_DRILL_CONFIG': {
      return {
        ...state,
        pendingSpeedDrillExercise: action.payload.exerciseType,
        screen: 'speed-drill-config'
      };
    }

    case 'START_SPEED_DRILL': {
      if (!state.vocabulary) return state;

      const { exerciseType, baseThresholdMs, incrementPerWordMs, vocabularyFilter } = action.payload;

      // Apply vocabulary filter if specified
      const activeVocabulary: VocabularyEntry[] = vocabularyFilter && vocabularyFilter.type !== 'all'
        ? filterVocabulary(state.vocabulary.active, vocabularyFilter, state.responseDatabase)
        : state.vocabulary.active;

      // If filter results in empty vocabulary, return error state
      if (activeVocabulary.length === 0) {
        return {
          ...state,
          error: 'No vocabulary items match the selected filter. Try a different filter or add more vocabulary.',
          screen: 'menu'
        };
      }

      // Create remaining words list (same as drill mode)
      let remainingWords: string[] | undefined;

      if (exerciseType === 'shuffled') {
        const allEntries = activeVocabulary.flatMap(v => [v.word, v.meaning]);
        remainingWords = shuffleArray(allEntries);
      } else if (exerciseType === 'shuffled-to-english') {
        const allEntries = activeVocabulary.flatMap(v => [v.word, v.pinyin]);
        remainingWords = shuffleArray(allEntries);
      } else if (exerciseType === 'english-to-pinyin') {
        remainingWords = shuffleArray(activeVocabulary.map(v => v.meaning));
      } else if (exerciseType === 'pinyin-to-english') {
        remainingWords = shuffleArray(activeVocabulary.map(v => v.pinyin));
      } else {
        remainingWords = shuffleArray(activeVocabulary.map(v => v.word));
      }

      const session = createNewSession(exerciseType, 'speed-drill', activeVocabulary.length);
      session.remainingWords = remainingWords;
      session.totalPrompts = remainingWords?.length; // Store initial total
      session.speedDrillConfig = { baseThresholdMs, incrementPerWordMs };

      // Create a filtered vocabulary data object for the session
      const filteredVocabularyData: VocabularyData = {
        ...state.vocabulary,
        active: activeVocabulary
      };

      const exercise = generateNewExercise(
        filteredVocabularyData,
        exerciseType,
        'speed-drill',
        [],
        remainingWords || []
      );

      return {
        ...state,
        currentSession: {
          ...session,
          vocabularyFilter,  // Store filter config in session
          filteredVocabulary: activeVocabulary  // Store filtered vocabulary for the session
        },
        currentExercise: exercise,
        currentAttempt: null,
        pendingSpeedDrillExercise: undefined,
        screen: 'exercise'
      };
    }

    case 'START_TONE_SEQUENCE': {
      return {
        ...state,
        screen: 'tone-sequence'
      };
    }

    case 'START_SENTENCE_READING': {
      return {
        ...state,
        screen: 'sentence-reading'
      };
    }

    case 'START_TONE_PATTERN': {
      return {
        ...state,
        screen: 'tone-pattern'
      };
    }

    case 'START_SIMILAR_CHARACTERS': {
      return {
        ...state,
        screen: 'similar-characters'
      };
    }

    case 'VIEW_DASHBOARD': {
      return {
        ...state,
        screen: 'dashboard'
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

    case 'SET_FOCUS_MODE': {
      // Persist to localStorage
      localStorage.setItem('focusOnWeaknesses', JSON.stringify(action.payload));
      return {
        ...state,
        focusOnWeaknesses: action.payload
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
      try {
        // Only save essential session data, not the full responseTimings array
        const sessionToSave = {
          ...state.currentSession,
          // Limit responseTimings to last 50 entries to prevent localStorage overflow
          responseTimings: state.currentSession.responseTimings?.slice(-50) || []
        };
        localStorage.setItem('currentSession', JSON.stringify(sessionToSave));
      } catch (error) {
        // localStorage quota exceeded - clear old data and try again
        console.warn('localStorage quota exceeded, clearing session cache:', error);
        try {
          localStorage.removeItem('currentSession');
        } catch {
          // Ignore if removal also fails
        }
      }
    }
  }, [state.currentSession]);

  // Save vocabulary to localStorage
  useEffect(() => {
    if (state.vocabulary) {
      localStorage.setItem('vocabulary', JSON.stringify(state.vocabulary));
    }
  }, [state.vocabulary]);

  // Load response database on mount
  useEffect(() => {
    loadResponseDatabase().then(database => {
      dispatch({ type: 'SET_RESPONSE_DATABASE', payload: database });
    }).catch(error => {
      console.error('Failed to load response database:', error);
    });
  }, []);

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
