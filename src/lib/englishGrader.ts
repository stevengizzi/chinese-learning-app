import type { ExerciseAttempt } from '../types/exercise';

export function gradeEnglishAnswer(
  userAnswer: string,
  correctAnswer: string,
  _prompt: string,
  exerciseId: string
): ExerciseAttempt {
  // Normalize both answers for comparison
  const normalizedUser = userAnswer.trim().toLowerCase();
  const normalizedCorrect = correctAnswer.trim().toLowerCase();

  // Simple exact match for now (case-insensitive)
  const isCorrect = normalizedUser === normalizedCorrect;

  return {
    exerciseId,
    userAnswer,
    correctAnswer,
    score: {
      correct: isCorrect ? 1 : 0,
      total: 1
    },
    errors: [], // No detailed error tracking for English answers
    timestamp: Date.now()
  };
}
