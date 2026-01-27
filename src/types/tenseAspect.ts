/**
 * Tense/Aspect Practice Types
 *
 * Types for practicing Chinese time/aspect markers (了, 过, 正在, 会, 没, 不)
 */

/**
 * Available aspect types for practice
 */
export type AspectType =
  | 'simple_present'
  | 'simple_present_neg'
  | 'future'
  | 'future_neg'
  | 'progressive'
  | 'progressive_neg'
  | 'completed'
  | 'completed_neg'
  | 'experience'
  | 'experience_neg';

/**
 * All aspect types for iteration
 */
export const ALL_ASPECT_TYPES: AspectType[] = [
  'simple_present',
  'simple_present_neg',
  'future',
  'future_neg',
  'progressive',
  'progressive_neg',
  'completed',
  'completed_neg',
  'experience',
  'experience_neg',
];

/**
 * Affirmative aspect types
 */
export const AFFIRMATIVE_ASPECTS: AspectType[] = [
  'simple_present',
  'future',
  'progressive',
  'completed',
  'experience',
];

/**
 * Negative aspect types
 */
export const NEGATIVE_ASPECTS: AspectType[] = [
  'simple_present_neg',
  'future_neg',
  'progressive_neg',
  'completed_neg',
  'experience_neg',
];

/**
 * Display names for each aspect type
 */
export const ASPECT_DISPLAY_NAMES: Record<AspectType, string> = {
  simple_present: 'Simple Present',
  simple_present_neg: 'Simple Present (Neg)',
  future: 'Future (会)',
  future_neg: 'Future Neg (不会)',
  progressive: 'Progressive (正在)',
  progressive_neg: 'Progressive Neg (没在)',
  completed: 'Completed (了)',
  completed_neg: 'Completed Neg (没)',
  experience: 'Experience (过)',
  experience_neg: 'Experience Neg (没...过)',
};

/**
 * Short labels for compact display
 */
export const ASPECT_SHORT_LABELS: Record<AspectType, string> = {
  simple_present: 'Present',
  simple_present_neg: 'Neg Present',
  future: '会',
  future_neg: '不会',
  progressive: '正在',
  progressive_neg: '没在',
  completed: '了',
  completed_neg: '没',
  experience: '过',
  experience_neg: '没...过',
};

/**
 * Markers associated with each aspect type
 */
export const ASPECT_MARKERS: Record<AspectType, string[]> = {
  simple_present: [],
  simple_present_neg: ['不'],
  future: ['会'],
  future_neg: ['不会', '不要'],
  progressive: ['正在', '在'],
  progressive_neg: ['没在', '不在'],
  completed: ['了'],
  completed_neg: ['没'],
  experience: ['过'],
  experience_neg: ['没', '过'],
};

/**
 * Colors for each aspect type (for UI badges)
 */
export const ASPECT_COLORS: Record<AspectType, { bg: string; text: string; border: string }> = {
  simple_present: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-200', border: 'border-gray-300 dark:border-gray-600' },
  simple_present_neg: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-200', border: 'border-gray-300 dark:border-gray-600' },
  future: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-200', border: 'border-blue-300 dark:border-blue-700' },
  future_neg: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-200', border: 'border-blue-300 dark:border-blue-700' },
  progressive: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-800 dark:text-amber-200', border: 'border-amber-300 dark:border-amber-700' },
  progressive_neg: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-800 dark:text-amber-200', border: 'border-amber-300 dark:border-amber-700' },
  completed: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-200', border: 'border-green-300 dark:border-green-700' },
  completed_neg: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-200', border: 'border-green-300 dark:border-green-700' },
  experience: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-200', border: 'border-purple-300 dark:border-purple-700' },
  experience_neg: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-200', border: 'border-purple-300 dark:border-purple-700' },
};

/**
 * A single tense/aspect practice item
 */
export interface TenseAspectItem {
  id: string;
  baseScenario: string;       // e.g., "eat lunch"
  aspectType: AspectType;
  englishPrompt: string;      // e.g., "I ate lunch"
  chineseAnswer: string;      // e.g., "我吃了午饭"
  pinyin: string;             // e.g., "wo3 chi1 le wu3 fan4"
  markers: string[];          // e.g., ["了"]
}

/**
 * Configuration for a tense/aspect practice session
 */
export interface TenseAspectConfig {
  selectedAspects: AspectType[];  // Which aspects to practice
  mode: 'standard' | 'speed';     // Standard or speed drill
  shuffle: boolean;               // Randomize order
  showHints: boolean;             // Show aspect type with prompt
}

/**
 * Default configuration
 */
export const DEFAULT_TENSE_ASPECT_CONFIG: TenseAspectConfig = {
  selectedAspects: [...ALL_ASPECT_TYPES],
  mode: 'standard',
  shuffle: true,
  showHints: true,
};

/**
 * A single attempt at answering
 */
export interface TenseAspectAttempt {
  itemId: string;
  aspectType: AspectType;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  markerCorrect: boolean;     // Did they get the marker right?
  timeMs: number;             // Response time
}

/**
 * A practice session
 */
export interface TenseAspectSession {
  id: string;
  config: TenseAspectConfig;
  startTime: number;
  endTime?: number;
  attempts: TenseAspectAttempt[];
  currentIndex: number;
  itemOrder: string[];        // IDs of items in order
}

/**
 * Overall state for the trainer
 */
export interface TenseAspectState {
  config: TenseAspectConfig | null;
  currentSession: TenseAspectSession | null;
  currentItem: TenseAspectItem | null;
  items: TenseAspectItem[];
  screen: 'setup' | 'exercise' | 'feedback' | 'report';
}
