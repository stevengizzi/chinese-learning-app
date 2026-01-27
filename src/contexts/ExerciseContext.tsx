import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { VocabularyData, VocabularyEntry } from '../types/vocabulary';
import type { Exercise, ExerciseAttempt, ExerciseType, PlayMode } from '../types/exercise';
import type { Session } from '../types/session';
import type { ResponseDatabase } from '../types/responseTracking';
import type { VocabularyFilterConfig } from '../types/vocabularyFilter';
import { generateExercise, shuffleArray, normalizeMeaning } from '../lib/exerciseGenerator';
import { gradeAnswer } from '../lib/pinyinGrader';
import { gradeEnglishAnswer } from '../lib/englishGrader';
import { generateSessionStatistics } from '../lib/reportGenerator';
import { loadResponseDatabase, addResponseRecords, saveResponseDatabase, countWords } from '../lib/responseTracking/storage';
import { filterVocabulary, hasMasteryFilterActive } from '../lib/vocabularyFilter';
import { updateDashboardOnSessionComplete } from '../lib/dashboard/storage';
import { convertPinyinStringToToneMarks } from '../lib/pinyinToneConverter';

type Screen = 'menu' | 'exercise' | 'feedback' | 'report' | 'view-vocabulary' | 'tone-sequence' | 'speed-drill-config' | 'sentence-reading' | 'tone-pattern' | 'similar-characters' | 'exercise-config' | 'dashboard' | 'tense-aspect' | 'flashcard';

/**
 * Create disambiguated prompts for remainingWords
 * Adds character/pinyin in parentheses when duplicates exist
 * @param vocabulary - The vocabulary entries to create prompts for (may be filtered subset)
 * @param exerciseType - The type of exercise
 * @param fullVocabulary - The full vocabulary list to check for duplicates (optional, defaults to vocabulary)
 */
function createDisambiguatedPrompts(
  vocabulary: VocabularyEntry[],
  exerciseType: ExerciseType,
  fullVocabulary?: VocabularyEntry[]
): string[] {
  // Use full vocabulary for duplicate detection if provided, otherwise use the exercise vocabulary
  const vocabForDuplicates = fullVocabulary || vocabulary;

  if (exerciseType === 'english-to-pinyin') {
    // Group by normalized meaning to find entries with equivalent meanings
    // e.g., "cup; glass" and "glass; cup" are considered equivalent
    // Check against FULL vocabulary, not just the filtered subset
    const normalizedMeaningCounts = new Map<string, number>();
    vocabForDuplicates.forEach(v => {
      const normalized = normalizeMeaning(v.meaning);
      normalizedMeaningCounts.set(normalized, (normalizedMeaningCounts.get(normalized) || 0) + 1);
    });

    return vocabulary.map(v => {
      const normalized = normalizeMeaning(v.meaning);
      if (normalizedMeaningCounts.get(normalized)! > 1) {
        return `${v.meaning} (${v.word})`;
      }
      return v.meaning;
    });
  }

  if (exerciseType === 'pinyin-to-english') {
    // Group by pinyin to find duplicates - check against FULL vocabulary
    const pinyinCounts = new Map<string, number>();
    vocabForDuplicates.forEach(v => {
      pinyinCounts.set(v.pinyin, (pinyinCounts.get(v.pinyin) || 0) + 1);
    });

    return vocabulary.map(v => {
      const pinyinWithTones = convertPinyinStringToToneMarks(v.pinyin);
      if (pinyinCounts.get(v.pinyin)! > 1) {
        return `${pinyinWithTones} (${v.word})`;
      }
      return pinyinWithTones;
    });
  }

  if (exerciseType === 'character-to-pinyin' || exerciseType === 'character-to-english') {
    // Group by word to find duplicates - check against FULL vocabulary
    const wordCounts = new Map<string, number>();
    vocabForDuplicates.forEach(v => {
      wordCounts.set(v.word, (wordCounts.get(v.word) || 0) + 1);
    });

    return vocabulary.map(v => {
      if (wordCounts.get(v.word)! > 1) {
        if (exerciseType === 'character-to-pinyin') {
          return `${v.word} (${v.meaning})`;
        } else {
          const pinyinWithTones = convertPinyinStringToToneMarks(v.pinyin);
          return `${v.word} (${pinyinWithTones})`;
        }
      }
      return v.word;
    });
  }

  // For shuffled modes, handle both word and meaning prompts
  if (exerciseType === 'shuffled') {
    // Group by normalized meaning to find entries with equivalent meanings
    // Check against FULL vocabulary
    const normalizedMeaningCounts = new Map<string, number>();
    const wordCounts = new Map<string, number>();
    vocabForDuplicates.forEach(v => {
      const normalized = normalizeMeaning(v.meaning);
      normalizedMeaningCounts.set(normalized, (normalizedMeaningCounts.get(normalized) || 0) + 1);
      wordCounts.set(v.word, (wordCounts.get(v.word) || 0) + 1);
    });

    const prompts: string[] = [];
    vocabulary.forEach(v => {
      // Add word prompt (with meaning disambiguation if needed)
      if (wordCounts.get(v.word)! > 1) {
        prompts.push(`${v.word} (${v.meaning})`);
      } else {
        prompts.push(v.word);
      }
      // Add meaning prompt (with character disambiguation if needed)
      const normalized = normalizeMeaning(v.meaning);
      if (normalizedMeaningCounts.get(normalized)! > 1) {
        prompts.push(`${v.meaning} (${v.word})`);
      } else {
        prompts.push(v.meaning);
      }
    });
    return prompts;
  }

  if (exerciseType === 'shuffled-to-english') {
    // Check against FULL vocabulary
    const pinyinCounts = new Map<string, number>();
    const wordCounts = new Map<string, number>();
    vocabForDuplicates.forEach(v => {
      pinyinCounts.set(v.pinyin, (pinyinCounts.get(v.pinyin) || 0) + 1);
      wordCounts.set(v.word, (wordCounts.get(v.word) || 0) + 1);
    });

    const prompts: string[] = [];
    vocabulary.forEach(v => {
      // Add word prompt (with pinyin disambiguation if needed)
      const pinyinWithTones = convertPinyinStringToToneMarks(v.pinyin);
      if (wordCounts.get(v.word)! > 1) {
        prompts.push(`${v.word} (${pinyinWithTones})`);
      } else {
        prompts.push(v.word);
      }
      // Add pinyin prompt (with character disambiguation if needed)
      if (pinyinCounts.get(v.pinyin)! > 1) {
        prompts.push(`${pinyinWithTones} (${v.word})`);
      } else {
        prompts.push(pinyinWithTones);
      }
    });
    return prompts;
  }

  // Default: just return words
  return vocabulary.map(v => v.word);
}

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
  | { type: 'START_TENSE_ASPECT' }
  | { type: 'START_FLASHCARD' }
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
  responseDatabase: ResponseDatabase | null = null,
  fullVocabulary?: VocabularyEntry[]
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
    focusMode,
    fullVocabulary
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

      // Apply vocabulary filter if specified (including when mastery filter is active)
      const shouldApplyFilter = vocabularyFilter &&
        (vocabularyFilter.type !== 'all' || hasMasteryFilterActive(vocabularyFilter));
      const activeVocabulary: VocabularyEntry[] = shouldApplyFilter
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
      // Uses disambiguation for duplicate meanings/pinyin/characters
      let remainingWords: string[] | undefined;

      if (playMode === 'complete-all' || playMode === 'drill' || playMode === 'speed-drill') {
        remainingWords = shuffleArray(createDisambiguatedPrompts(activeVocabulary, exerciseType, state.vocabulary.active));
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
        state.responseDatabase,
        state.vocabulary.active  // Full vocabulary for disambiguation
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
        state.responseDatabase,
        state.vocabulary?.active  // Full vocabulary for disambiguation
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

      // Apply vocabulary filter if specified (including when mastery filter is active)
      const shouldApplyFilter = vocabularyFilter &&
        (vocabularyFilter.type !== 'all' || hasMasteryFilterActive(vocabularyFilter));
      const activeVocabulary: VocabularyEntry[] = shouldApplyFilter
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

      // Create remaining words list with disambiguation for duplicates
      const remainingWords = shuffleArray(createDisambiguatedPrompts(activeVocabulary, exerciseType, state.vocabulary.active));

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
        remainingWords || [],
        false,  // focusOnWeaknesses
        null,   // responseDatabase
        state.vocabulary.active  // Full vocabulary for disambiguation
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

    case 'START_TENSE_ASPECT': {
      return {
        ...state,
        screen: 'tense-aspect'
      };
    }

    case 'START_FLASHCARD': {
      return {
        ...state,
        screen: 'flashcard'
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

  // Update dashboard stats when session completes (transitions to report screen)
  useEffect(() => {
    if (state.screen === 'report' && state.currentSession && state.currentSession.attempts.length > 0) {
      updateDashboardOnSessionComplete(state.currentSession);
    }
  }, [state.screen, state.currentSession]);

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
