import type { SessionStatistics } from '../types/session';
import type { ExerciseAttempt } from '../types/exercise';

export function generateSessionStatistics(attempts: ExerciseAttempt[]): SessionStatistics {
  if (attempts.length === 0) {
    return {
      totalExercises: 0,
      totalCharacters: 0,
      correctCharacters: 0,
      averageAccuracy: 0,
      toneErrors: 0,
      syllableErrors: 0,
      commonMistakes: {}
    };
  }

  let totalCharacters = 0;
  let correctCharacters = 0;
  let toneErrors = 0;
  let syllableErrors = 0;
  const mistakes: Record<string, number> = {};

  for (const attempt of attempts) {
    totalCharacters += attempt.score.total;
    correctCharacters += attempt.score.correct;

    for (const error of attempt.errors) {
      if (error.errorType === 'tone') {
        toneErrors++;
        const mistakeKey = `${error.expectedPinyin} (got: ${error.userPinyin || 'missing tone'})`;
        mistakes[mistakeKey] = (mistakes[mistakeKey] || 0) + 1;
      } else if (error.errorType === 'syllable') {
        syllableErrors++;
        const mistakeKey = `${error.expectedPinyin} vs ${error.userPinyin}`;
        mistakes[mistakeKey] = (mistakes[mistakeKey] || 0) + 1;
      } else if (error.errorType === 'missing') {
        syllableErrors++;
      }
    }
  }

  const averageAccuracy = totalCharacters > 0
    ? Math.round((correctCharacters / totalCharacters) * 100)
    : 0;

  return {
    totalExercises: attempts.length,
    totalCharacters,
    correctCharacters,
    averageAccuracy,
    toneErrors,
    syllableErrors,
    commonMistakes: mistakes
  };
}

export function generateSuggestions(statistics: SessionStatistics): string[] {
  const suggestions: string[] = [];

  if (statistics.totalExercises === 0) {
    return ['Complete some exercises to get personalized suggestions!'];
  }

  // Analyze error patterns
  if (statistics.toneErrors > statistics.syllableErrors * 2) {
    suggestions.push('Focus on tone accuracy - try saying each tone out loud');
  }

  if (statistics.syllableErrors > statistics.toneErrors) {
    suggestions.push('Review syllable pronunciation - consider breaking down pinyin rules');
  }

  if (statistics.averageAccuracy < 70) {
    suggestions.push('Take your time with each exercise - accuracy is more important than speed');
  } else if (statistics.averageAccuracy > 90) {
    suggestions.push('Excellent work! Consider adding more vocabulary to increase challenge');
  }

  // Common mistakes analysis
  const sortedMistakes = Object.entries(statistics.commonMistakes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  if (sortedMistakes.length > 0) {
    const topMistake = sortedMistakes[0];
    suggestions.push(`Most common error: ${topMistake[0]} (${topMistake[1]} times)`);
  }

  return suggestions;
}
