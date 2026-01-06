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

  let prompt: string;

  if ((playMode === 'complete-all' || playMode === 'drill') && remainingWords.length > 0) {
    // Pick from remaining words (could be word or meaning for shuffled mode)
    const promptToUse = remainingWords[0];
    // Try to find by word first, then by meaning
    const entry = vocabulary.find(v => v.word === promptToUse || v.meaning === promptToUse);
    if (!entry) {
      throw new Error('Entry not found in vocabulary');
    }
    selectedEntry = entry;
    // For shuffled mode in complete-all/drill, use the exact prompt from remainingWords
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
    if (exerciseType === 'character-to-pinyin') {
      prompt = selectedEntry.word;
    } else if (exerciseType === 'english-to-pinyin') {
      prompt = selectedEntry.meaning;
    } else {
      // shuffled mode: randomly choose between character or meaning
      prompt = Math.random() < 0.5 ? selectedEntry.word : selectedEntry.meaning;
    }
  }

  const exerciseId = `${selectedEntry.word}-${Date.now()}`;

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
