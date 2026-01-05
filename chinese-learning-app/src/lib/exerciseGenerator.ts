import type { VocabularyEntry } from '../types/vocabulary';
import type { Exercise } from '../types/exercise';

export function generateExercise(
  vocabulary: VocabularyEntry[],
  recentExerciseIds: string[] = []
): Exercise {
  if (vocabulary.length === 0) {
    throw new Error('No vocabulary available for exercises');
  }

  // For MVP: Select a random word
  // Future: implement spaced repetition, avoid recent words, etc.
  let selectedEntry: VocabularyEntry;
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

  const exerciseId = `${selectedEntry.word}-${Date.now()}`;

  return {
    id: exerciseId,
    sentence: selectedEntry.word,
    correctPinyin: selectedEntry.pinyin,
    words: [selectedEntry]
  };
}
