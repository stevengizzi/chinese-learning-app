import type { ExerciseType, PlayMode } from '../types/exercise';

export interface HighScore {
  averageTimePerCorrectAnswer: number;  // in milliseconds
  date: string;  // ISO date string
  totalExercises: number;
  averageAccuracy: number;
}

export interface HighScoreKey {
  exerciseType: ExerciseType;
  playMode: PlayMode;
}

const HIGH_SCORES_KEY = 'highScores';

/**
 * Gets all high scores from localStorage
 */
export function getAllHighScores(): Record<string, HighScore> {
  try {
    const stored = localStorage.getItem(HIGH_SCORES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Failed to load high scores:', error);
    return {};
  }
}

/**
 * Gets high score for a specific exercise type and play mode
 */
export function getHighScore(exerciseType: ExerciseType, playMode: PlayMode): HighScore | null {
  const highScores = getAllHighScores();
  const key = `${exerciseType}-${playMode}`;
  return highScores[key] || null;
}

/**
 * Updates high score if the new score is better (lower average time)
 * Returns true if a new high score was set
 */
export function updateHighScore(
  exerciseType: ExerciseType,
  playMode: PlayMode,
  averageTimePerCorrectAnswer: number,
  totalExercises: number,
  averageAccuracy: number
): boolean {
  const key = `${exerciseType}-${playMode}`;
  const highScores = getAllHighScores();
  const currentHighScore = highScores[key];

  // Check if this is a new high score (lower average time is better)
  const isNewHighScore = !currentHighScore ||
    averageTimePerCorrectAnswer < currentHighScore.averageTimePerCorrectAnswer;

  if (isNewHighScore) {
    highScores[key] = {
      averageTimePerCorrectAnswer,
      date: new Date().toISOString(),
      totalExercises,
      averageAccuracy
    };

    try {
      localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(highScores));
      return true;
    } catch (error) {
      console.error('Failed to save high score:', error);
      return false;
    }
  }

  return false;
}

/**
 * Formats time in milliseconds to a readable string
 */
export function formatTime(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  } else {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }
}

/**
 * Formats a date string to a readable format
 */
export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}
