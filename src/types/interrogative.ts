/**
 * Interrogative (Question Word) Practice Types
 *
 * Types for practicing Chinese question words (什么, 谁, 哪儿, 什么时候, 为什么, 怎么, etc.)
 */

/**
 * Available question word types for practice
 */
export type QuestionType =
  // Core question words
  | 'what'              // 什么
  | 'who'               // 谁
  | 'where'             // 哪儿/哪里
  | 'which'             // 哪 + classifier + noun
  | 'when_general'      // 什么时候
  | 'when_time'         // 几点
  | 'when_day'          // 哪天/星期几
  | 'when_date'         // 几号/几月几号
  | 'why'               // 为什么
  | 'how_method'        // 怎么 + verb (how to...)
  | 'how_quality'       // ...怎么样 (how is...)
  | 'how_suggestion'    // 怎么样 (how about...)
  | 'how_much'          // 多少钱
  | 'how_many'          // 几/多少 + classifier
  | 'how_adjective';    // 多 + adjective

/**
 * All question types for iteration
 */
export const ALL_QUESTION_TYPES: QuestionType[] = [
  'what',
  'who',
  'where',
  'which',
  'when_general',
  'when_time',
  'when_day',
  'when_date',
  'why',
  'how_method',
  'how_quality',
  'how_suggestion',
  'how_much',
  'how_many',
  'how_adjective',
];

/**
 * Grouped question types for setup UI
 */
export const BASIC_QUESTION_TYPES: QuestionType[] = [
  'what',
  'who',
  'where',
  'which',
];

export const WHEN_QUESTION_TYPES: QuestionType[] = [
  'when_general',
  'when_time',
  'when_day',
  'when_date',
];

export const HOW_QUESTION_TYPES: QuestionType[] = [
  'how_method',
  'how_quality',
  'how_suggestion',
  'how_much',
  'how_many',
  'how_adjective',
];

export const WHY_QUESTION_TYPES: QuestionType[] = [
  'why',
];

/**
 * Display names for each question type
 */
export const QUESTION_DISPLAY_NAMES: Record<QuestionType, string> = {
  what: 'What (什么)',
  who: 'Who (谁)',
  where: 'Where (哪儿/哪里)',
  which: 'Which (哪 + noun)',
  when_general: 'When (什么时候)',
  when_time: 'What time (几点)',
  when_day: 'Which day (哪天)',
  when_date: 'What date (几号)',
  why: 'Why (为什么)',
  how_method: 'How to... (怎么+V)',
  how_quality: 'How is... (...怎么样)',
  how_suggestion: 'How about... (怎么样)',
  how_much: 'How much (多少钱)',
  how_many: 'How many (几/多少)',
  how_adjective: 'How + adj (多+adj)',
};

/**
 * Short labels for compact display
 */
export const QUESTION_SHORT_LABELS: Record<QuestionType, string> = {
  what: '什么',
  who: '谁',
  where: '哪儿',
  which: '哪+N',
  when_general: '什么时候',
  when_time: '几点',
  when_day: '哪天',
  when_date: '几号',
  why: '为什么',
  how_method: '怎么+V',
  how_quality: '...怎么样',
  how_suggestion: '怎么样?',
  how_much: '多少钱',
  how_many: '几/多少',
  how_adjective: '多+adj',
};

/**
 * Key markers associated with each question type
 */
export const QUESTION_MARKERS: Record<QuestionType, string[]> = {
  what: ['什么'],
  who: ['谁'],
  where: ['哪儿', '哪里', '哪'],
  which: ['哪'],
  when_general: ['什么时候'],
  when_time: ['几点'],
  when_day: ['哪天', '星期几'],
  when_date: ['几号', '几月'],
  why: ['为什么'],
  how_method: ['怎么'],
  how_quality: ['怎么样'],
  how_suggestion: ['怎么样'],
  how_much: ['多少钱', '多少'],
  how_many: ['几', '多少'],
  how_adjective: ['多'],
};

/**
 * Colors for each question type (for UI badges)
 */
export const QUESTION_COLORS: Record<QuestionType, { bg: string; text: string; border: string }> = {
  what: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-200', border: 'border-blue-300 dark:border-blue-700' },
  who: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-200', border: 'border-purple-300 dark:border-purple-700' },
  where: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-200', border: 'border-green-300 dark:border-green-700' },
  which: { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-800 dark:text-teal-200', border: 'border-teal-300 dark:border-teal-700' },
  when_general: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-800 dark:text-amber-200', border: 'border-amber-300 dark:border-amber-700' },
  when_time: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-800 dark:text-amber-200', border: 'border-amber-300 dark:border-amber-700' },
  when_day: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-800 dark:text-amber-200', border: 'border-amber-300 dark:border-amber-700' },
  when_date: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-800 dark:text-amber-200', border: 'border-amber-300 dark:border-amber-700' },
  why: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200', border: 'border-red-300 dark:border-red-700' },
  how_method: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-800 dark:text-indigo-200', border: 'border-indigo-300 dark:border-indigo-700' },
  how_quality: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-800 dark:text-indigo-200', border: 'border-indigo-300 dark:border-indigo-700' },
  how_suggestion: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-800 dark:text-indigo-200', border: 'border-indigo-300 dark:border-indigo-700' },
  how_much: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-800 dark:text-pink-200', border: 'border-pink-300 dark:border-pink-700' },
  how_many: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-800 dark:text-pink-200', border: 'border-pink-300 dark:border-pink-700' },
  how_adjective: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-800 dark:text-cyan-200', border: 'border-cyan-300 dark:border-cyan-700' },
};

/**
 * A single interrogative practice item
 */
export interface InterrogativeItem {
  id: string;
  baseScenario: string;       // e.g., "ask about name"
  questionType: QuestionType;
  englishPrompt: string;      // e.g., "What is your name?"
  chineseAnswer: string;      // e.g., "你叫什么名字？"
  pinyin: string;             // e.g., "ni3 jiao4 shen2 me ming2 zi4"
  alternateAnswers?: string[];  // Acceptable alternative answers
  markers: string[];          // e.g., ["什么"]
}

/**
 * Configuration for an interrogative practice session
 */
export interface InterrogativeConfig {
  selectedTypes: QuestionType[];  // Which question types to practice
  mode: 'standard' | 'speed';     // Standard or speed drill
  shuffle: boolean;               // Randomize order
  showHints: boolean;             // Show question type with prompt
}

/**
 * Default configuration
 */
export const DEFAULT_INTERROGATIVE_CONFIG: InterrogativeConfig = {
  selectedTypes: [...ALL_QUESTION_TYPES],
  mode: 'standard',
  shuffle: true,
  showHints: true,
};

/**
 * A single attempt at answering
 */
export interface InterrogativeAttempt {
  itemId: string;
  questionType: QuestionType;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  markerCorrect: boolean;     // Did they get the question word right?
  timeMs: number;             // Response time
}

/**
 * A practice session
 */
export interface InterrogativeSession {
  id: string;
  config: InterrogativeConfig;
  startTime: number;
  endTime?: number;
  attempts: InterrogativeAttempt[];
  currentIndex: number;
  itemOrder: string[];        // IDs of items in order
}

/**
 * Overall state for the trainer
 */
export interface InterrogativeState {
  config: InterrogativeConfig | null;
  currentSession: InterrogativeSession | null;
  currentItem: InterrogativeItem | null;
  items: InterrogativeItem[];
  screen: 'setup' | 'exercise' | 'feedback' | 'report';
}
