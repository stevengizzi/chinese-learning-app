import type { PlayMode } from './exercise';
import type { SpeechRate, ReplayLimit } from './tts';

/**
 * Parts of a vocabulary entry that can appear on flashcard sides
 */
export type FlashcardPart = 'hanzi' | 'pinyin' | 'english' | 'audio';

/**
 * Configuration for what appears on each side of the flashcard
 */
export interface FlashcardSideConfig {
  front: FlashcardPart[];
  back: FlashcardPart[];
}

/**
 * Audio settings for flashcard audio playback
 */
export interface FlashcardAudioSettings {
  speechRate: SpeechRate;
  replayLimit: ReplayLimit;
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
  // Audio settings (when audio is on front or back)
  audioSettings?: FlashcardAudioSettings;
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

  // Can't have all parts on one side (4 total parts now with audio)
  if (config.front.length === 4) return false;
  if (config.back.length === 4) return false;

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
    case 'audio': return 'Audio';
  }
}

/**
 * Check if a flashcard configuration uses audio
 */
export function hasAudioPart(config: FlashcardSideConfig): boolean {
  return config.front.includes('audio') || config.back.includes('audio');
}
