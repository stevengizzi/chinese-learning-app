import type { VocabularyEntry } from '../types/vocabulary';
import type { Exercise, ExerciseType, PlayMode } from '../types/exercise';
import type { PromptType, ResponseDatabase } from '../types/responseTracking';
import { convertPinyinStringToToneMarks } from './pinyinToneConverter';
import { rankVocabularyByPriority, selectWeightedByPriority, type TrainingPriorityScore } from './trainingPriority';
import { generateVocabularyId } from './responseTracking/storage';

/**
 * Normalize a meaning string for semantic comparison.
 * Splits by semicolon, trims whitespace, lowercases, and sorts alphabetically.
 * This allows "cup; glass" to match "glass; cup" as equivalent meanings.
 */
export function normalizeMeaning(meaning: string): string {
  return meaning
    .split(';')
    .map(s => s.trim().toLowerCase())
    .sort()
    .join(';');
}

/**
 * Check if two meanings are semantically equivalent.
 * They're equivalent if they contain the same set of meaning segments.
 */
export function meaningsAreEquivalent(meaning1: string, meaning2: string): boolean {
  return normalizeMeaning(meaning1) === normalizeMeaning(meaning2);
}

/**
 * Group vocabulary by normalized meaning to find entries with equivalent meanings.
 * Returns a Map where keys are normalized meanings and values are arrays of entries.
 */
export function groupByNormalizedMeaning(vocabulary: VocabularyEntry[]): Map<string, VocabularyEntry[]> {
  const groups = new Map<string, VocabularyEntry[]>();
  for (const entry of vocabulary) {
    const normalized = normalizeMeaning(entry.meaning);
    const group = groups.get(normalized) || [];
    group.push(entry);
    groups.set(normalized, group);
  }
  return groups;
}

/**
 * Check if a vocabulary entry has equivalent meanings with other entries.
 * Used for disambiguation in English prompts.
 */
export function hasEquivalentMeanings(entry: VocabularyEntry, vocabulary: VocabularyEntry[]): boolean {
  const normalizedMeaning = normalizeMeaning(entry.meaning);
  return vocabulary.some(v => v !== entry && normalizeMeaning(v.meaning) === normalizedMeaning);
}

/**
 * Determine the prompt type based on what was shown to the user
 */
function determinePromptType(
  prompt: string,
  selectedEntry: VocabularyEntry,
  isPinyinExercise: boolean,
  exerciseType?: ExerciseType
): PromptType {
  // For audio exercises, use specialized prompt types
  if (exerciseType === 'audio-to-pinyin') {
    return 'character-to-pinyin';  // Treat audio prompts like character prompts for tracking
  }
  if (exerciseType === 'audio-to-english') {
    return 'character-to-english';  // Treat audio prompts like character prompts for tracking
  }

  // Check if the original prompt (before disambiguation) matches character, pinyin, or meaning
  const promptWithoutDisambiguation = prompt.split(' (')[0]; // Remove disambiguation text

  if (promptWithoutDisambiguation === selectedEntry.word || prompt.startsWith(selectedEntry.word + ' (')) {
    // Prompt is a character
    if (isPinyinExercise) {
      return 'character-to-pinyin';
    } else {
      return 'character-to-english';
    }
  } else if (promptWithoutDisambiguation === selectedEntry.meaning || prompt.includes(selectedEntry.meaning)) {
    // Prompt is English meaning
    return 'english-to-pinyin';
  } else {
    // Prompt is pinyin (with tone marks or in parentheses)
    return 'pinyin-to-english';
  }
}

/**
 * Get the prompt type for a given exercise type (for priority calculation)
 */
function getPromptTypeForExercise(exerciseType: ExerciseType): PromptType {
  switch (exerciseType) {
    case 'character-to-pinyin':
      return 'character-to-pinyin';
    case 'character-to-english':
      return 'character-to-english';
    case 'english-to-pinyin':
      return 'english-to-pinyin';
    case 'pinyin-to-english':
      return 'pinyin-to-english';
    case 'shuffled':
      // For shuffled pinyin exercises, use character-to-pinyin as representative
      return 'character-to-pinyin';
    case 'shuffled-to-english':
      // For shuffled English exercises, use character-to-english as representative
      return 'character-to-english';
    case 'audio-to-pinyin':
      // Audio to pinyin uses audio prompt (similar to character prompt)
      return 'character-to-pinyin';
    case 'audio-to-english':
      // Audio to English uses audio prompt (similar to character prompt)
      return 'character-to-english';
    default:
      return 'character-to-pinyin';
  }
}

/**
 * Get the prompt string for a vocabulary entry based on exercise type
 */
function getPromptForEntry(entry: VocabularyEntry, exerciseType: ExerciseType): string {
  if (exerciseType === 'character-to-pinyin' || exerciseType === 'character-to-english') {
    return entry.word;
  } else if (exerciseType === 'english-to-pinyin') {
    return entry.meaning;
  } else if (exerciseType === 'pinyin-to-english') {
    return entry.pinyin;
  } else if (exerciseType === 'shuffled') {
    // shuffled (to pinyin): randomly choose between character or meaning
    return Math.random() < 0.5 ? entry.word : entry.meaning;
  } else if (exerciseType === 'audio-to-pinyin' || exerciseType === 'audio-to-english') {
    // Audio exercises: use the character as the "prompt" (will be converted to audio)
    return entry.word;
  } else {
    // shuffled-to-english: randomly choose between character or pinyin
    return Math.random() < 0.5 ? entry.word : entry.pinyin;
  }
}

/**
 * Options for focus-on-weaknesses mode
 */
interface FocusModeOptions {
  enabled: boolean;
  responseDatabase: ResponseDatabase;
  rankedItems?: TrainingPriorityScore[];  // Pre-computed rankings (optional, for performance)
}

export function generateExercise(
  vocabulary: VocabularyEntry[],
  exerciseType: ExerciseType,
  playMode: PlayMode,
  recentExerciseIds: string[] = [],
  remainingWords: string[] = [],
  focusMode?: FocusModeOptions,
  fullVocabulary?: VocabularyEntry[]  // Full vocabulary for disambiguation (optional)
): Exercise {
  if (vocabulary.length === 0) {
    throw new Error('No vocabulary available for exercises');
  }

  let selectedEntry: VocabularyEntry | undefined;
  let prompt: string;

  // Speed Drill, Complete-All, and Drill modes: use remainingWords
  if ((playMode === 'complete-all' || playMode === 'drill' || playMode === 'speed-drill') && remainingWords.length > 0) {
    // Pick from remaining words (could be word, meaning, or pinyin)
    const promptToUse = remainingWords[0];

    // Find matching vocabulary entry using multiple strategies
    // Note: pinyin prompts use tone marks (e.g., "yuè") but v.pinyin uses numbers (e.g., "yue4")
    let entry = vocabulary.find(v =>
      v.word === promptToUse ||
      v.meaning === promptToUse ||
      v.pinyin === promptToUse ||
      convertPinyinStringToToneMarks(v.pinyin) === promptToUse
    );

    // If not found directly, try matching disambiguated prompts
    // e.g., prompt might be "yesterday (昨)" or "哥哥 (older brother)"
    // Extract both the main part and the parenthetical for precise matching
    if (!entry) {
      const parenMatch = promptToUse.match(/^(.+?)\s*\((.+)\)$/);
      if (parenMatch) {
        const [, mainPart, disambiguator] = parenMatch;
        // Find entry where both parts match (main + disambiguator)
        entry = vocabulary.find(v =>
          (v.meaning === mainPart && v.word === disambiguator) ||
          (v.word === mainPart && v.meaning === disambiguator) ||
          (v.word === mainPart && convertPinyinStringToToneMarks(v.pinyin) === disambiguator) ||
          (convertPinyinStringToToneMarks(v.pinyin) === mainPart && v.word === disambiguator)
        );
      }
    }

    // Fallback: try simple partial matching
    if (!entry) {
      entry = vocabulary.find(v => {
        const pinyinWithTones = convertPinyinStringToToneMarks(v.pinyin);
        return promptToUse.startsWith(v.word + ' ') ||
          promptToUse.startsWith(v.word + '(') ||
          promptToUse.startsWith(v.meaning + ' ') ||
          promptToUse.startsWith(v.meaning + '(') ||
          promptToUse.startsWith(v.pinyin + ' ') ||
          promptToUse.startsWith(v.pinyin + '(') ||
          promptToUse.startsWith(pinyinWithTones + ' ') ||
          promptToUse.startsWith(pinyinWithTones + '(');
      });
    }

    // Also try matching if the vocabulary entry contains the prompt (for partial meanings)
    // This handles cases where cached vocabulary has different meaning lengths than remainingWords
    if (!entry) {
      const promptLower = promptToUse.toLowerCase();
      entry = vocabulary.find(v => {
        const meaningLower = v.meaning.toLowerCase();
        // Try both directions: prompt contains meaning OR meaning contains prompt
        return meaningLower.includes(promptLower) ||
               promptLower.includes(meaningLower) ||
               meaningLower.startsWith(promptLower) ||
               promptLower.startsWith(meaningLower);
      });
    }

    if (!entry) {
      // If still not found, log warning but DON'T skip - pick random entry to avoid sync issues
      // The session will still properly remove this prompt from remainingWords
      console.warn('Entry not found in vocabulary for prompt:', promptToUse, '- using random fallback');
      const randomIndex = Math.floor(Math.random() * vocabulary.length);
      entry = vocabulary[randomIndex];
    }

    selectedEntry = entry;
    // For shuffled modes in complete-all/drill, use the exact prompt from remainingWords
    prompt = promptToUse;
  } else if (focusMode?.enabled && focusMode.responseDatabase) {
    // Focus on Weaknesses mode: use priority-based selection
    const promptType = getPromptTypeForExercise(exerciseType);

    // Use pre-computed rankings if available, otherwise compute them
    const rankedItems = focusMode.rankedItems ||
      rankVocabularyByPriority(vocabulary, promptType, focusMode.responseDatabase);

    // Convert recent exercise IDs to vocabulary IDs for exclusion
    const recentVocabIds = recentExerciseIds.map(word => {
      const entry = vocabulary.find(v => v.word === word);
      return entry ? generateVocabularyId(entry.word, entry.pinyin, entry.meaning) : '';
    }).filter(id => id !== '');

    // Select using weighted priority
    const selectedVocabId = selectWeightedByPriority(rankedItems, recentVocabIds);

    if (selectedVocabId) {
      // Find the vocabulary entry matching this ID
      selectedEntry = vocabulary.find(v =>
        generateVocabularyId(v.word, v.pinyin, v.meaning) === selectedVocabId
      );
    }

    // Fallback to random if priority selection failed
    if (!selectedEntry) {
      const randomIndex = Math.floor(Math.random() * vocabulary.length);
      selectedEntry = vocabulary[randomIndex];
    }

    // Determine prompt based on exercise type
    prompt = getPromptForEntry(selectedEntry, exerciseType);
  } else {
    // Random selection (endless mode without focus)
    let attempts = 0;
    const maxAttempts = 50;

    do {
      const randomIndex = Math.floor(Math.random() * vocabulary.length);
      selectedEntry = vocabulary[randomIndex];
      attempts++;

      // Try to avoid recently used words, but don't loop forever
      if (attempts >= maxAttempts) {
        break;
      }
    } while (recentExerciseIds.includes(selectedEntry.word) && vocabulary.length > 1);

    // Determine prompt based on exercise type for endless mode
    prompt = getPromptForEntry(selectedEntry, exerciseType);
  }

  // Use full vocabulary for disambiguation if provided, otherwise use exercise vocabulary
  const vocabForDisambiguation = fullVocabulary || vocabulary;

  // Check if we need to disambiguate pinyin and convert to tone marks
  // If the prompt is pinyin and there are multiple entries with the same pinyin, add the character
  // Check against FULL vocabulary, not just the filtered subset
  if (prompt === selectedEntry.pinyin) {
    // Convert numbered pinyin to tone marks
    const pinyinWithTones = convertPinyinStringToToneMarks(selectedEntry.pinyin);

    const entriesWithSamePinyin = vocabForDisambiguation.filter(v => v.pinyin === selectedEntry.pinyin);
    if (entriesWithSamePinyin.length > 1) {
      prompt = `${pinyinWithTones} (${selectedEntry.word})`;
    } else {
      prompt = pinyinWithTones;
    }
  }

  // Check if we need to disambiguate English meanings
  // If the prompt is a meaning and there are multiple entries with equivalent meanings
  // (same set of meaning segments regardless of order), add the character
  // Check against FULL vocabulary, not just the filtered subset
  if (prompt === selectedEntry.meaning) {
    const entriesWithEquivalentMeaning = vocabForDisambiguation.filter(v =>
      meaningsAreEquivalent(v.meaning, selectedEntry.meaning)
    );
    if (entriesWithEquivalentMeaning.length > 1) {
      prompt = `${selectedEntry.meaning} (${selectedEntry.word})`;
    }
  }

  // Check if we need to disambiguate characters with same word but different pinyin
  // If prompt is a character and multiple entries share it, disambiguate based on exercise type
  // Check against FULL vocabulary, not just the filtered subset
  if (prompt === selectedEntry.word) {
    const entriesWithSameWord = vocabForDisambiguation.filter(v => v.word === selectedEntry.word);
    if (entriesWithSameWord.length > 1) {
      const isPinyinExercise = exerciseType.endsWith('-pinyin') || exerciseType === 'shuffled';
      const isEnglishExercise = exerciseType.endsWith('-english');

      if (isPinyinExercise) {
        // For pinyin exercises, show meaning in parentheses
        prompt = `${selectedEntry.word} (${selectedEntry.meaning})`;
      } else if (isEnglishExercise) {
        // For English exercises, show pinyin in parentheses
        const pinyinWithTones = convertPinyinStringToToneMarks(selectedEntry.pinyin);
        prompt = `${selectedEntry.word} (${pinyinWithTones})`;
      }
    }
  }

  const exerciseId = `${selectedEntry.word}-${Date.now()}`;

  // Determine correct answer based on exercise type
  const isPinyinExercise = exerciseType.endsWith('-pinyin') || exerciseType === 'shuffled';
  const isEnglishExercise = exerciseType.endsWith('-english');

  // Determine prompt type based on what was shown
  const promptType = determinePromptType(prompt, selectedEntry, isPinyinExercise, exerciseType);

  return {
    id: exerciseId,
    type: exerciseType,
    prompt,
    promptType,
    correctPinyin: isPinyinExercise ? selectedEntry.pinyin : undefined,
    correctMeaning: isEnglishExercise ? selectedEntry.meaning : undefined,
    words: [selectedEntry]
  };
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
