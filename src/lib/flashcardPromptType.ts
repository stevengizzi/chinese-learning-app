/**
 * Flashcard Prompt Type Mapping
 *
 * Maps flashcard front/back configurations to PromptType values
 * so flashcard attempts can be recorded in the response database.
 */

import type { FlashcardPart } from '../types/flashcard';
import type { PromptType } from '../types/responseTracking';
import type { CharacterSet } from './characterConverter';

/**
 * Determine the PromptType for a flashcard configuration.
 *
 * Priority on front (lowest to highest): hanzi < english < pinyin < audio
 * Hanzi is treated as "context" and only maps when it's the sole front element.
 * When audio and pinyin are both on the front, pinyin takes priority (audio is context).
 *
 * Returns null if no valid mapping exists (e.g., same parts on both sides).
 */
export function getFlashcardPromptType(
  front: FlashcardPart[],
  back: FlashcardPart[],
  characterSet: CharacterSet
): PromptType | null {
  const hasFront = (part: FlashcardPart) => front.includes(part);
  const hasBack = (part: FlashcardPart) => back.includes(part);

  // Determine primary front element (priority: audio < pinyin < english < hanzi,
  // but audio+pinyin together → pinyin wins)
  let primary: 'audio' | 'pinyin' | 'english' | 'hanzi' | null = null;

  if (hasFront('audio') && !hasFront('pinyin')) {
    primary = 'audio';
  } else if (hasFront('pinyin')) {
    primary = 'pinyin';
  } else if (hasFront('english')) {
    primary = 'english';
  } else if (hasFront('hanzi')) {
    primary = 'hanzi';
  }

  if (!primary) return null;

  // Determine target from back (first match: english, pinyin, hanzi)
  let target: 'english' | 'pinyin' | 'hanzi' | null = null;
  if (hasBack('english')) {
    target = 'english';
  } else if (hasBack('pinyin')) {
    target = 'pinyin';
  } else if (hasBack('hanzi')) {
    target = 'hanzi';
  }

  if (!target) return null;

  // Map primary × target → PromptType
  const isTraditional = characterSet === 'traditional';

  if (primary === 'audio' && target === 'english') return 'audio-to-english';
  if (primary === 'audio' && target === 'pinyin') return 'audio-to-pinyin';
  if (primary === 'pinyin' && target === 'english') return 'pinyin-to-english';
  if (primary === 'english' && target === 'pinyin') return 'english-to-pinyin';

  if (primary === 'hanzi' && target === 'english') {
    return isTraditional ? 'traditional-to-english' : 'simplified-to-english';
  }
  if (primary === 'hanzi' && target === 'pinyin') {
    return isTraditional ? 'traditional-to-pinyin' : 'simplified-to-pinyin';
  }

  // No valid mapping (e.g., audio→hanzi, pinyin→hanzi, english→hanzi, hanzi→hanzi)
  return null;
}

/**
 * Determine the "answer" part from a flashcard back configuration.
 * Used to calculate wordCount for the response record.
 */
export function getFlashcardAnswerPart(back: FlashcardPart[]): 'english' | 'pinyin' | 'hanzi' | null {
  if (back.includes('english')) return 'english';
  if (back.includes('pinyin')) return 'pinyin';
  if (back.includes('hanzi')) return 'hanzi';
  return null;
}
