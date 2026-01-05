import type { ExerciseAttempt, ErrorDetail } from '../types/exercise';

interface SyllableComparison {
  expected: string;
  user: string;
  baseSyllableMatch: boolean;
  toneMatch: boolean;
}

function normalizePinyin(pinyin: string): string {
  return pinyin.trim().toLowerCase().replace(/\s+/g, ' ');
}

function splitSyllables(pinyin: string): string[] {
  return pinyin.split(' ').filter(s => s.length > 0);
}

function extractBaseSyllableAndTone(syllable: string): { base: string; tone: string } {
  // Extract tone number (1-4) or neutral tone (often omitted)
  const toneMatch = syllable.match(/[1-4]$/);

  if (toneMatch) {
    return {
      base: syllable.slice(0, -1),
      tone: toneMatch[0]
    };
  }

  // No tone found - could be neutral tone or missing
  return {
    base: syllable,
    tone: ''
  };
}

function compareSyllables(expected: string, user: string): SyllableComparison {
  const expectedParts = extractBaseSyllableAndTone(expected);
  const userParts = extractBaseSyllableAndTone(user);

  return {
    expected,
    user,
    baseSyllableMatch: expectedParts.base === userParts.base,
    toneMatch: expectedParts.tone === userParts.tone
  };
}

export function gradeAnswer(
  userAnswer: string,
  correctAnswer: string,
  sentence: string,
  exerciseId: string
): ExerciseAttempt {
  const normalizedUser = normalizePinyin(userAnswer);
  const normalizedCorrect = normalizePinyin(correctAnswer);

  const userSyllables = splitSyllables(normalizedUser);
  const correctSyllables = splitSyllables(normalizedCorrect);
  const characters = sentence.split('');

  const errors: ErrorDetail[] = [];
  let correctCount = 0;

  // Compare syllable by syllable
  const maxLength = Math.max(userSyllables.length, correctSyllables.length);

  for (let i = 0; i < maxLength; i++) {
    const expectedSyllable = correctSyllables[i];
    const userSyllable = userSyllables[i];
    const character = characters[i] || '';

    if (!expectedSyllable && userSyllable) {
      // Extra syllable provided
      errors.push({
        characterIndex: i,
        character: '',
        expectedPinyin: '',
        userPinyin: userSyllable,
        errorType: 'extra'
      });
    } else if (expectedSyllable && !userSyllable) {
      // Missing syllable
      errors.push({
        characterIndex: i,
        character,
        expectedPinyin: expectedSyllable,
        userPinyin: '',
        errorType: 'missing'
      });
    } else if (expectedSyllable && userSyllable) {
      const comparison = compareSyllables(expectedSyllable, userSyllable);

      if (comparison.baseSyllableMatch && comparison.toneMatch) {
        // Fully correct
        correctCount++;
      } else if (comparison.baseSyllableMatch && !comparison.toneMatch) {
        // Tone error
        errors.push({
          characterIndex: i,
          character,
          expectedPinyin: expectedSyllable,
          userPinyin: userSyllable,
          errorType: 'tone'
        });
      } else {
        // Syllable error (wrong base syllable)
        errors.push({
          characterIndex: i,
          character,
          expectedPinyin: expectedSyllable,
          userPinyin: userSyllable,
          errorType: 'syllable'
        });
      }
    }
  }

  return {
    exerciseId,
    userAnswer: normalizedUser,
    correctAnswer: normalizedCorrect,
    score: {
      correct: correctCount,
      total: correctSyllables.length
    },
    errors,
    timestamp: Date.now()
  };
}
