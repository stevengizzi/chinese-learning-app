import type { VocabularyEntry } from '../types/vocabulary';
import type { Exercise, ExerciseType, PlayMode } from '../types/exercise';
import type { PromptType } from '../types/responseTracking';
import { convertPinyinStringToToneMarks } from './pinyinToneConverter';

/**
 * Determine the prompt type based on what was shown to the user
 */
function determinePromptType(
  prompt: string,
  selectedEntry: VocabularyEntry,
  isPinyinExercise: boolean
): PromptType {
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

export function generateExercise(
  vocabulary: VocabularyEntry[],
  exerciseType: ExerciseType,
  playMode: PlayMode,
  recentExerciseIds: string[] = [],
  remainingWords: string[] = []
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
    // Try to find by word first, then by meaning, then by pinyin
    let entry = vocabulary.find(v => v.word === promptToUse || v.meaning === promptToUse || v.pinyin === promptToUse);

    // If not found directly, try partial matching for cases where disambiguation was added
    // e.g., prompt might be "哥哥 (older brother)" but we need to match "哥哥"
    if (!entry) {
      // Try matching if promptToUse starts with the word/meaning/pinyin followed by space or paren
      entry = vocabulary.find(v =>
        promptToUse.startsWith(v.word + ' ') ||
        promptToUse.startsWith(v.word + '(') ||
        promptToUse.startsWith(v.meaning + ' ') ||
        promptToUse.startsWith(v.meaning + '(') ||
        promptToUse.startsWith(v.pinyin + ' ') ||
        promptToUse.startsWith(v.pinyin + '(')
      );
    }

    if (!entry) {
      // Last resort: skip this prompt and try the next one if available
      console.warn('Entry not found in vocabulary for prompt:', promptToUse);
      if (remainingWords.length > 1) {
        // Recursively try with remaining words (skip the problematic one)
        return generateExercise(vocabulary, exerciseType, playMode, recentExerciseIds, remainingWords.slice(1));
      }
      // If no more words, fall back to random selection
      const randomIndex = Math.floor(Math.random() * vocabulary.length);
      entry = vocabulary[randomIndex];
    }
    selectedEntry = entry;
    // For shuffled modes in complete-all/drill, use the exact prompt from remainingWords
    prompt = promptToUse;
  } else {
    // Random selection (endless mode)
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
    if (exerciseType === 'character-to-pinyin' || exerciseType === 'character-to-english') {
      prompt = selectedEntry.word;
    } else if (exerciseType === 'english-to-pinyin') {
      prompt = selectedEntry.meaning;
    } else if (exerciseType === 'pinyin-to-english') {
      prompt = selectedEntry.pinyin;
    } else if (exerciseType === 'shuffled') {
      // shuffled (to pinyin): randomly choose between character or meaning
      prompt = Math.random() < 0.5 ? selectedEntry.word : selectedEntry.meaning;
    } else {
      // shuffled-to-english: randomly choose between character or pinyin
      prompt = Math.random() < 0.5 ? selectedEntry.word : selectedEntry.pinyin;
    }
  }

  // Check if we need to disambiguate pinyin and convert to tone marks
  // If the prompt is pinyin and there are multiple entries with the same pinyin, add the character
  if (prompt === selectedEntry.pinyin) {
    // Convert numbered pinyin to tone marks
    const pinyinWithTones = convertPinyinStringToToneMarks(selectedEntry.pinyin);

    const entriesWithSamePinyin = vocabulary.filter(v => v.pinyin === selectedEntry.pinyin);
    if (entriesWithSamePinyin.length > 1) {
      prompt = `${pinyinWithTones} (${selectedEntry.word})`;
    } else {
      prompt = pinyinWithTones;
    }
  }

  // Check if we need to disambiguate English meanings
  // If the prompt is a meaning and there are multiple entries with the same meaning, add the character
  if (prompt === selectedEntry.meaning) {
    const entriesWithSameMeaning = vocabulary.filter(v => v.meaning === selectedEntry.meaning);
    if (entriesWithSameMeaning.length > 1) {
      prompt = `${selectedEntry.meaning} (${selectedEntry.word})`;
    }
  }

  // Check if we need to disambiguate characters with same word but different pinyin
  // If prompt is a character and multiple entries share it, disambiguate based on exercise type
  if (prompt === selectedEntry.word) {
    const entriesWithSameWord = vocabulary.filter(v => v.word === selectedEntry.word);
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
  const promptType = determinePromptType(prompt, selectedEntry, isPinyinExercise);

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
