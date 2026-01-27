import type { PlayMode } from './exercise';

/**
 * Parts of a vocabulary entry that can appear on flashcard sides
 */
export type FlashcardPart = 'hanzi' | 'pinyin' | 'english';

/**
 * Configuration for what appears on each side of the flashcard
 */
export interface FlashcardSideConfig {
  front: FlashcardPart[];
  back: FlashcardPart[];
}

/**
 * Full flashcard exercise configuration
 */
export interface FlashcardConfig {
  playMode: PlayMode;
  sideConfig: FlashcardSideConfig;
  // Speed drill settings (when applicable)
  speedDrillCount?: number;
  speedDrillThreshold?: number;
}

/**
 * A single flashcard attempt
 */
export interface FlashcardAttempt {
  vocabId: string;
  word: string;
  pinyin: string;
  meaning: string;
  correct: boolean;
  timeToFlip: number;  // ms from showing front to flipping
  timeToAnswer: number; // ms from flipping to answering
}

/**
 * Session state for flashcard exercise
 */
export interface FlashcardSessionState {
  config: FlashcardConfig;
  attempts: FlashcardAttempt[];
  currentIndex: number;
  isFlipped: boolean;
  flipTimestamp: number | null;
  showTimestamp: number;
  // For drill mode - track which items still need correct answers
  remainingItems: number[];
  // For complete-all mode - track completion
  completedItems: Set<string>;
}

/**
 * Validate that a side config is valid (not all on one side, not empty sides)
 */
export function isValidSideConfig(config: FlashcardSideConfig): boolean {
  // Front must have at least one part
  if (config.front.length === 0) return false;

  // Back must have at least one part
  if (config.back.length === 0) return false;

  // Can't have all parts on one side (3 total parts)
  if (config.front.length === 3) return false;
  if (config.back.length === 3) return false;

  // No overlap between front and back
  const frontSet = new Set(config.front);
  for (const part of config.back) {
    if (frontSet.has(part)) return false;
  }

  return true;
}

/**
 * Get display label for a flashcard part
 */
export function getPartLabel(part: FlashcardPart): string {
  switch (part) {
    case 'hanzi': return 'Hanzi';
    case 'pinyin': return 'Pinyin';
    case 'english': return 'English';
  }
}
