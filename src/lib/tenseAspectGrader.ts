/**
 * Tense/Aspect Grader
 *
 * Grades user answers for tense/aspect exercises with focus on correct marker usage.
 */

import type { AspectType } from '../types/tenseAspect';
import { ASPECT_MARKERS } from '../types/tenseAspect';

export interface MarkerAnalysis {
  expectedMarkers: string[];
  foundMarkers: string[];
  missingMarkers: string[];
  wrongMarkers: string[];
  markerCorrect: boolean;
}

export interface TenseAspectGradeResult {
  isCorrect: boolean;
  markerAnalysis: MarkerAnalysis;
  similarity: number;
  feedback: string;
}

/**
 * All possible aspect markers for checking wrong marker usage
 */
const ALL_MARKERS = ['了', '过', '正在', '在', '会', '没', '不', '不会', '没在'];

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
  aspectType: AspectType
): boolean {
  // 正在 and 在 are interchangeable for progressive
  if (aspectType === 'progressive') {
    if ((foundMarker === '在' && expectedMarkers.includes('正在')) ||
        (foundMarker === '正在' && expectedMarkers.includes('在'))) {
      return true;
    }
  }

  // 没在 and 不在 are both acceptable for progressive negative
  if (aspectType === 'progressive_neg') {
    if ((foundMarker === '不在' && expectedMarkers.includes('没在')) ||
        (foundMarker === '没在' && expectedMarkers.includes('不在'))) {
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
  aspectType: AspectType
): MarkerAnalysis {
  const foundMarkers: string[] = [];
  const missingMarkers: string[] = [];
  const wrongMarkers: string[] = [];

  // Check for expected markers (check longer markers first to avoid partial matches)
  const sortedExpected = [...expectedMarkers].sort((a, b) => b.length - a.length);
  for (const marker of sortedExpected) {
    if (userAnswer.includes(marker)) {
      foundMarkers.push(marker);
    } else {
      // Check for acceptable alternatives
      let foundAlternative = false;
      for (const alt of ALL_MARKERS) {
        if (userAnswer.includes(alt) && isAcceptableAlternative(alt, [marker], aspectType)) {
          foundMarkers.push(alt);
          foundAlternative = true;
          break;
        }
      }
      if (!foundAlternative) {
        missingMarkers.push(marker);
      }
    }
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

      if (!isPartOfLonger && !isAcceptableAlternative(marker, expectedMarkers, aspectType)) {
        // Check if this marker is genuinely wrong for this aspect type
        const expectedForAspect = ASPECT_MARKERS[aspectType];
        if (!expectedForAspect.includes(marker)) {
          wrongMarkers.push(marker);
          usedMarkers.add(marker);
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
    issues.push(`Wrong marker: ${markerAnalysis.wrongMarkers.join(', ')}`);
  }

  if (issues.length === 0 && similarity < 0.8) {
    issues.push('Character differences');
  }

  return issues.join('; ') || 'Not quite right';
}

/**
 * Grade a user's answer for a tense/aspect exercise
 */
export function gradeTenseAspectAnswer(
  userAnswer: string,
  correctAnswer: string,
  aspectType: AspectType
): TenseAspectGradeResult {
  const expectedMarkers = ASPECT_MARKERS[aspectType];

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

  // Analyze markers
  const markerAnalysis = analyzeMarkers(normalizedUser, expectedMarkers, aspectType);

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
