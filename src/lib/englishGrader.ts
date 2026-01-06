import type { ExerciseAttempt } from '../types/exercise';

export function gradeEnglishAnswer(
  userAnswer: string,
  correctAnswer: string,
  _prompt: string,
  exerciseId: string
): ExerciseAttempt {
  // Parse comma-separated meanings
  const correctMeanings = correctAnswer
    .split(',')
    .map(m => m.trim().toLowerCase())
    .filter(m => m.length > 0);

  const userMeanings = userAnswer
    .split(',')
    .map(m => m.trim().toLowerCase())
    .filter(m => m.length > 0);

  // Count how many user meanings match correct meanings (order-independent)
  let correctCount = 0;
  for (const userMeaning of userMeanings) {
    if (correctMeanings.includes(userMeaning)) {
      correctCount++;
    }
  }

  const totalMeanings = correctMeanings.length;

  return {
    exerciseId,
    userAnswer,
    correctAnswer,
    score: {
      correct: correctCount,
      total: totalMeanings
    },
    errors: [], // No detailed error tracking for English answers
    timestamp: Date.now()
  };
}
