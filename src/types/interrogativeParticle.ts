/**
 * Interrogative Particle Practice Types
 *
 * Types for practicing Chinese question particles (吗/呢/吧)
 * - 吗 (ma): Yes/no questions
 * - 呢 (ne): Follow-up questions, "what about...?"
 * - 吧 (ba): Suggestions, confirmations, softening statements
 */

/**
 * The three question particles
 */
export type InterrogativeParticle = '吗' | '呢' | '吧';

/**
 * All interrogative particles
 */
export const ALL_INTERROGATIVE_PARTICLES: InterrogativeParticle[] = ['吗', '呢', '吧'];

/**
 * Display information for each particle
 */
export const INTERROGATIVE_INFO: Record<InterrogativeParticle, {
  pinyin: string;
  name: string;
  usage: string;
  examples: string[];
  color: { bg: string; text: string; border: string };
}> = {
  '吗': {
    pinyin: 'ma',
    name: 'Yes/No Question',
    usage: 'Turn a statement into a yes/no question',
    examples: ['你好吗？', '他是学生吗？'],
    color: { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-800 dark:text-rose-200', border: 'border-rose-300 dark:border-rose-700' },
  },
  '呢': {
    pinyin: 'ne',
    name: 'Follow-up Question',
    usage: 'Ask "what about...?" or continue a topic',
    examples: ['你呢？', '他们呢？'],
    color: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-800 dark:text-amber-200', border: 'border-amber-300 dark:border-amber-700' },
  },
  '吧': {
    pinyin: 'ba',
    name: 'Suggestion/Confirmation',
    usage: 'Make suggestions or seek confirmation',
    examples: ['我们走吧！', '是你吧？'],
    color: { bg: 'bg-sky-100 dark:bg-sky-900/30', text: 'text-sky-800 dark:text-sky-200', border: 'border-sky-300 dark:border-sky-700' },
  },
};

/**
 * A single interrogative particle practice item
 */
export interface InterrogativeItem {
  id: string;
  particle: InterrogativeParticle;
  instruction: string;           // e.g., "Turn into a yes/no question"
  statementChinese: string;      // e.g., "他是学生"
  statementEnglish: string;      // e.g., "He is a student"
  questionChinese: string;       // e.g., "他是学生吗？"
  questionEnglish: string;       // e.g., "Is he a student?"
  pinyin: string;                // e.g., "ta1 shi4 xue2 sheng ma"
}

/**
 * Configuration for an interrogative particle practice session
 */
export interface InterrogativeConfig {
  selectedParticles: InterrogativeParticle[];  // Which particles to practice
  mode: 'standard' | 'speed';                   // Standard or speed drill
  shuffle: boolean;                              // Randomize order
  showHints: boolean;                            // Show particle type hints
}

/**
 * Default configuration
 */
export const DEFAULT_INTERROGATIVE_CONFIG: InterrogativeConfig = {
  selectedParticles: [...ALL_INTERROGATIVE_PARTICLES],
  mode: 'standard',
  shuffle: true,
  showHints: true,
};

/**
 * A single attempt at answering
 */
export interface InterrogativeAttempt {
  itemId: string;
  particle: InterrogativeParticle;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeMs: number;
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
  itemOrder: string[];
}

/**
 * Overall state for the trainer
 */
export interface InterrogativeState {
  config: InterrogativeConfig | null;
  currentSession: InterrogativeSession | null;
  currentItem: InterrogativeItem | null;
  items: InterrogativeItem[];
  screen: 'setup' | 'exercise' | 'report';
}
