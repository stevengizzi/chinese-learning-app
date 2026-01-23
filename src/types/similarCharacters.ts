/**
 * Types for the Similar Characters Recognition exercise.
 */

/**
 * Exercise mode selection
 * - 'pinyin-to-character': Show pinyin, select the correct character from options
 * - 'english-to-character': Show English meaning, select the correct character from options
 */
export type SimilarCharactersMode = 'pinyin-to-character' | 'english-to-character';

/**
 * Difficulty level for confusion pairs
 */
export type ConfusionDifficulty = 'easy' | 'medium' | 'hard';

/**
 * Category of character similarity
 */
export type SimilarityCategory =
  | 'radical-based'
  | 'stroke-similar'
  | 'component-shared'
  | 'mirror-image'
  | 'phonetic-similar';

/**
 * Individual character entry in the similar characters database
 */
export interface SimilarCharacterEntry {
  character: string;
  pinyin: string;
  meaning: string;
  hskLevel: number | null;
  notes?: string;
}

/**
 * A pair of characters that are commonly confused
 */
export interface ConfusionPair {
  a: string;
  b: string;
  difficulty: ConfusionDifficulty;
}

/**
 * A group of visually similar characters
 */
export interface SimilarCharacterGroup {
  id: string;
  name: string;
  category: SimilarityCategory;
  characters: SimilarCharacterEntry[];
  confusionPairs: ConfusionPair[];
}

/**
 * The complete similar characters database
 */
export interface SimilarCharactersDatabase {
  version: number;
  lastUpdated: string;
  groups: SimilarCharacterGroup[];
  metadata: {
    totalGroups: number;
    totalCharacters: number;
    categories: SimilarityCategory[];
  };
}

/**
 * Configuration for a similar characters exercise session
 */
export interface SimilarCharactersConfig {
  mode: SimilarCharactersMode;
  shuffle: boolean;
  categories?: SimilarityCategory[];
}

/**
 * An exercise item for Multiple Choice mode (Mode A)
 */
export interface MultipleChoiceItem {
  id: string;
  targetCharacter: string;
  targetPinyin: string;
  targetMeaning: string;
  options: string[];
  optionsData: SimilarCharacterEntry[];
  correctIndex: number;
  groupId: string;
  isFromVocabulary: boolean;
}

/**
 * An exercise item for Pair Distinction mode (Mode B)
 */
export interface PairDistinctionItem {
  id: string;
  characterA: string;
  characterB: string;
  dataA: SimilarCharacterEntry;
  dataB: SimilarCharacterEntry;
  targetCharacter: string;
  targetPinyin: string;
  targetMeaning: string;
  difficulty: ConfusionDifficulty;
  groupId: string;
  isFromVocabulary: boolean;
}

/**
 * Union type for exercise items
 */
export type SimilarCharactersItem = MultipleChoiceItem | PairDistinctionItem;

/**
 * Result of a single exercise attempt
 */
export interface SimilarCharactersAttempt {
  itemId: string;
  selectedCharacter: string;
  correctCharacter: string;
  wasCorrect: boolean;
  responseTimeMs: number;
  timestamp: number;
}

/**
 * Statistics for a specific character pair
 */
export interface CharacterPairStats {
  pairId: string;
  characterA: string;
  characterB: string;
  totalAttempts: number;
  correctAttempts: number;
  averageResponseTimeMs: number;
  lastAttemptTimestamp: number;
  recentResults: boolean[];
}

/**
 * Statistics database for similar characters practice
 */
export interface SimilarCharactersStats {
  version: number;
  pairStats: Record<string, CharacterPairStats>;
  lastUpdated: number;
}

/**
 * Session state for the trainer
 */
export interface SimilarCharactersSession {
  config: SimilarCharactersConfig;
  startTime: number;
  items: SimilarCharactersItem[];
  attempts: SimilarCharactersAttempt[];
  currentIndex: number;
}

/**
 * Screen states for the trainer
 */
export type SimilarCharactersScreen = 'setup' | 'exercise' | 'complete';
