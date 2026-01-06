import type { VocabularyEntry } from '../types/vocabulary';
import type { Exercise, ExerciseType, PlayMode } from '../types/exercise';

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

  let selectedEntry: VocabularyEntry;

  if ((playMode === 'complete-all' || playMode === 'drill') && remainingWords.length > 0) {
    // Pick from remaining words
    const wordToUse = remainingWords[0];
    const entry = vocabulary.find(v => v.word === wordToUse);
    if (!entry) {
      throw new Error('Word not found in vocabulary');
    }
    selectedEntry = entry;
  } else {
    // Random selection (endless mode or first pick in complete-all)
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
  }

  const exerciseId = `${selectedEntry.word}-${Date.now()}`;

  // Determine prompt based on exercise type
  const prompt = exerciseType === 'character-to-pinyin'
    ? selectedEntry.word
    : selectedEntry.meaning;

  return {
    id: exerciseId,
    type: exerciseType,
    prompt,
    correctPinyin: selectedEntry.pinyin,
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
