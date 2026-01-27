/**
 * Structural Particle Practice Types
 *
 * Types for practicing Chinese structural particles (的/地/得)
 * - 的 (de): Links modifier to noun (adjective + 的 + noun)
 * - 地 (de): Links adverb to verb (adverb + 地 + verb)
 * - 得 (de): Links verb to complement (verb + 得 + complement)
 */

/**
 * The three structural particles
 */
export type StructuralParticle = '的' | '地' | '得';

/**
 * All structural particles
 */
export const ALL_STRUCTURAL_PARTICLES: StructuralParticle[] = ['的', '地', '得'];

/**
 * Display information for each particle
 */
export const PARTICLE_INFO: Record<StructuralParticle, {
  pinyin: string;
  name: string;
  usage: string;
  pattern: string;
  color: { bg: string; text: string; border: string };
}> = {
  '的': {
    pinyin: 'de',
    name: 'Attributive',
    usage: 'Links modifier to noun',
    pattern: 'modifier + 的 + noun',
    color: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-200', border: 'border-blue-300 dark:border-blue-700' },
  },
  '地': {
    pinyin: 'de',
    name: 'Adverbial',
    usage: 'Links adverb to verb',
    pattern: 'adverb + 地 + verb',
    color: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-200', border: 'border-green-300 dark:border-green-700' },
  },
  '得': {
    pinyin: 'de',
    name: 'Complement',
    usage: 'Links verb to complement',
    pattern: 'verb + 得 + complement',
    color: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-200', border: 'border-purple-300 dark:border-purple-700' },
  },
};

/**
 * A single structural particle practice item
 */
export interface StructuralParticleItem {
  id: string;
  particle: StructuralParticle;
  instruction: string;           // e.g., "Make 'happy' describe 'child'"
  baseElements: string;          // e.g., "高兴 + 孩子"
  englishHint: string;           // e.g., "happy child"
  chineseAnswer: string;         // e.g., "高兴的孩子"
  pinyin: string;                // e.g., "gao1 xing4 de hai2 zi"
}

/**
 * Configuration for a structural particle practice session
 */
export interface StructuralParticleConfig {
  selectedParticles: StructuralParticle[];  // Which particles to practice
  mode: 'standard' | 'speed';               // Standard or speed drill
  shuffle: boolean;                          // Randomize order
  showHints: boolean;                        // Show particle type hints
}

/**
 * Default configuration
 */
export const DEFAULT_STRUCTURAL_PARTICLE_CONFIG: StructuralParticleConfig = {
  selectedParticles: [...ALL_STRUCTURAL_PARTICLES],
  mode: 'standard',
  shuffle: true,
  showHints: true,
};

/**
 * A single attempt at answering
 */
export interface StructuralParticleAttempt {
  itemId: string;
  particle: StructuralParticle;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeMs: number;
}

/**
 * A practice session
 */
export interface StructuralParticleSession {
  id: string;
  config: StructuralParticleConfig;
  startTime: number;
  endTime?: number;
  attempts: StructuralParticleAttempt[];
  currentIndex: number;
  itemOrder: string[];
}

/**
 * Overall state for the trainer
 */
export interface StructuralParticleState {
  config: StructuralParticleConfig | null;
  currentSession: StructuralParticleSession | null;
  currentItem: StructuralParticleItem | null;
  items: StructuralParticleItem[];
  screen: 'setup' | 'exercise' | 'report';
}
