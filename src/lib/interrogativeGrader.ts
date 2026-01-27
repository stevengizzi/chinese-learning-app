/**
 * Interrogative (Question Word) Grader
 *
 * Grades user answers for interrogative exercises with focus on correct question word usage.
 */

import type { QuestionType } from '../types/interrogative';
import { QUESTION_MARKERS } from '../types/interrogative';

export interface MarkerAnalysis {
  expectedMarkers: string[];
  foundMarkers: string[];
  missingMarkers: string[];
  wrongMarkers: string[];
  markerCorrect: boolean;
}

export interface InterrogativeGradeResult {
  isCorrect: boolean;
  markerAnalysis: MarkerAnalysis;
  similarity: number;
  feedback: string;
}

/**
 * All possible question markers for checking wrong marker usage
 */
const ALL_MARKERS = [
  '什么', '谁', '哪儿', '哪里', '哪', '几', '多少',
  '什么时候', '几点', '哪天', '星期几', '几号', '几月',
  '为什么', '怎么', '怎么样', '多少钱', '多'
];

/**
 * Normalize Chinese text for comparison
 */
function normalizeChineseText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, '') // Remove all spaces
    .replace(/[，。！？、；：""''（）【】]/g, '') // Remove Chinese punctuation
    .replace(/[,.!?;:'"()[\]]/g, ''); // Remove English punctuation
}

/**
 * Calculate similarity between two strings using Levenshtein distance
 */
function calculateSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  const distance = matrix[a.length][b.length];
  const maxLength = Math.max(a.length, b.length);
  return 1 - distance / maxLength;
}

/**
 * Check if a marker is an acceptable alternative
 */
function isAcceptableAlternative(
  foundMarker: string,
  expectedMarkers: string[],
  questionType: QuestionType
): boolean {
  // 哪儿 and 哪里 are interchangeable for "where"
  if (questionType === 'where') {
    if ((foundMarker === '哪里' && expectedMarkers.includes('哪儿')) ||
        (foundMarker === '哪儿' && expectedMarkers.includes('哪里'))) {
      return true;
    }
  }

  // 几 and 多少 can sometimes be interchanged for "how many"
  if (questionType === 'how_many') {
    if ((foundMarker === '几' && expectedMarkers.includes('多少')) ||
        (foundMarker === '多少' && expectedMarkers.includes('几'))) {
      return true;
    }
  }

  // 哪天 and 星期几 for "which day"
  if (questionType === 'when_day') {
    if ((foundMarker === '星期几' && expectedMarkers.includes('哪天')) ||
        (foundMarker === '哪天' && expectedMarkers.includes('星期几'))) {
      return true;
    }
  }

  return false;
}

/**
 * Analyze marker usage in the user's answer
 */
function analyzeMarkers(
  userAnswer: string,
  expectedMarkers: string[],
  questionType: QuestionType
): MarkerAnalysis {
  const foundMarkers: string[] = [];
  const missingMarkers: string[] = [];
  const wrongMarkers: string[] = [];

  // Check for expected markers (check longer markers first to avoid partial matches)
  const sortedExpected = [...expectedMarkers].sort((a, b) => b.length - a.length);
  let expectedFound = false;

  for (const marker of sortedExpected) {
    if (userAnswer.includes(marker)) {
      foundMarkers.push(marker);
      expectedFound = true;
      break; // Only need to find one of the expected markers
    }
  }

  // If none of the expected markers found, check for acceptable alternatives
  if (!expectedFound) {
    for (const alt of ALL_MARKERS) {
      if (userAnswer.includes(alt) && isAcceptableAlternative(alt, expectedMarkers, questionType)) {
        foundMarkers.push(alt);
        expectedFound = true;
        break;
      }
    }
  }

  // If still not found, mark as missing
  if (!expectedFound && expectedMarkers.length > 0) {
    // Add the first expected marker as missing (most common form)
    missingMarkers.push(expectedMarkers[0]);
  }

  // Check for wrong markers (markers that shouldn't be there)
  // Sort by length descending to match longer markers first
  const sortedAllMarkers = [...ALL_MARKERS].sort((a, b) => b.length - a.length);
  const usedMarkers = new Set<string>();

  for (const marker of sortedAllMarkers) {
    // Skip if already found as expected or alternative
    if (foundMarkers.includes(marker)) continue;

    // Check if marker is in answer and not already accounted for
    if (userAnswer.includes(marker)) {
      // Check if it's part of a longer marker we already found
      let isPartOfLonger = false;
      for (const found of foundMarkers) {
        if (found.includes(marker) && found !== marker) {
          isPartOfLonger = true;
          break;
        }
      }
      for (const used of usedMarkers) {
        if (used.includes(marker) && used !== marker) {
          isPartOfLonger = true;
          break;
        }
      }

      if (!isPartOfLonger && !isAcceptableAlternative(marker, expectedMarkers, questionType)) {
        // Check if this marker is genuinely wrong for this question type
        const expectedForType = QUESTION_MARKERS[questionType];
        if (!expectedForType.includes(marker)) {
          // Only mark as wrong if it's a question word that's completely different
          // For example, using 什么 when expecting 谁
          const isQuestionWord = ALL_MARKERS.some(m => m === marker &&
            !expectedForType.some(e => e.includes(marker) || marker.includes(e)));
          if (isQuestionWord) {
            wrongMarkers.push(marker);
            usedMarkers.add(marker);
          }
        }
      }
    }
  }

  const markerCorrect = missingMarkers.length === 0 && wrongMarkers.length === 0;

  return {
    expectedMarkers,
    foundMarkers,
    missingMarkers,
    wrongMarkers,
    markerCorrect,
  };
}

/**
 * Generate feedback message based on grading result
 */
function generateFeedback(
  markerAnalysis: MarkerAnalysis,
  similarity: number,
  isCorrect: boolean
): string {
  if (isCorrect) {
    if (similarity === 1) {
      return 'Perfect!';
    }
    return 'Correct!';
  }

  const issues: string[] = [];

  if (markerAnalysis.missingMarkers.length > 0) {
    issues.push(`Missing: ${markerAnalysis.missingMarkers.join(', ')}`);
  }

  if (markerAnalysis.wrongMarkers.length > 0) {
    issues.push(`Wrong question word: ${markerAnalysis.wrongMarkers.join(', ')}`);
  }

  if (issues.length === 0 && similarity < 0.8) {
    issues.push('Character differences');
  }

  return issues.join('; ') || 'Not quite right';
}

/**
 * Grade a user's answer for an interrogative exercise
 */
export function gradeInterrogativeAnswer(
  userAnswer: string,
  correctAnswer: string,
  questionType: QuestionType,
  alternateAnswers?: string[]
): InterrogativeGradeResult {
  const expectedMarkers = QUESTION_MARKERS[questionType];

  // Normalize both answers
  const normalizedUser = normalizeChineseText(userAnswer);
  const normalizedCorrect = normalizeChineseText(correctAnswer);

  // Check exact match first
  if (normalizedUser === normalizedCorrect) {
    return {
      isCorrect: true,
      markerAnalysis: {
        expectedMarkers,
        foundMarkers: expectedMarkers,
        missingMarkers: [],
        wrongMarkers: [],
        markerCorrect: true,
      },
      similarity: 1,
      feedback: 'Perfect!',
    };
  }

  // Check alternate answers if provided
  if (alternateAnswers) {
    for (const alt of alternateAnswers) {
      const normalizedAlt = normalizeChineseText(alt);
      if (normalizedUser === normalizedAlt) {
        return {
          isCorrect: true,
          markerAnalysis: {
            expectedMarkers,
            foundMarkers: expectedMarkers,
            missingMarkers: [],
            wrongMarkers: [],
            markerCorrect: true,
          },
          similarity: 1,
          feedback: 'Perfect!',
        };
      }
    }
  }

  // Analyze markers
  const markerAnalysis = analyzeMarkers(normalizedUser, expectedMarkers, questionType);

  // Calculate similarity
  const similarity = calculateSimilarity(normalizedUser, normalizedCorrect);

  // Determine correctness
  // Correct if: markers are right AND similarity is high enough (allowing minor typos)
  const isCorrect = markerAnalysis.markerCorrect && similarity >= 0.85;

  // Generate feedback
  const feedback = generateFeedback(markerAnalysis, similarity, isCorrect);

  return {
    isCorrect,
    markerAnalysis,
    similarity,
    feedback,
  };
}
