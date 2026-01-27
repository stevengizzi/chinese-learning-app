/**
 * Tense/Aspect Corpus Parser
 *
 * Parses the tense_aspect.txt corpus file into TenseAspectItem objects.
 */

import type { TenseAspectItem, AspectType } from '../types/tenseAspect';
import { ASPECT_MARKERS } from '../types/tenseAspect';

/**
 * Map from corpus aspect type names to AspectType
 */
const ASPECT_TYPE_MAP: Record<string, AspectType> = {
  'SIMPLE_PRESENT': 'simple_present',
  'SIMPLE_PRESENT_NEG': 'simple_present_neg',
  'FUTURE': 'future',
  'FUTURE_NEG': 'future_neg',
  'PROGRESSIVE': 'progressive',
  'PROGRESSIVE_NEG': 'progressive_neg',
  'DURATIVE': 'durative',
  'DURATIVE_NEG': 'durative_neg',
  'CONTINUOUS': 'continuous',
  'CONTINUOUS_NEG': 'continuous_neg',
  'COMPLETED': 'completed',
  'COMPLETED_NEG': 'completed_neg',
  'EXPERIENCE': 'experience',
  'EXPERIENCE_NEG': 'experience_neg',
};

/**
 * Parses the tense/aspect corpus file into TenseAspectItem objects.
 *
 * Expected format:
 * BASE: eat lunch
 * SIMPLE_PRESENT: I eat lunch | 我吃午饭 | wo3 chi1 wu3 fan4
 * COMPLETED: I ate lunch | 我吃了午饭 | wo3 chi1 le wu3 fan4
 * ...
 * ===
 *
 * Blocks are separated by ===. Lines starting with # are comments.
 */
export function parseTenseAspectCorpus(content: string): TenseAspectItem[] {
  const items: TenseAspectItem[] = [];
  const lines = content.split('\n');

  let currentBase: string | null = null;
  let itemIndex = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (trimmed.startsWith('#') || trimmed === '') {
      continue;
    }

    // Block separator
    if (trimmed === '===') {
      currentBase = null;
      continue;
    }

    // Parse BASE line
    if (trimmed.startsWith('BASE:')) {
      currentBase = trimmed.substring(5).trim();
      continue;
    }

    // Parse aspect lines
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;

    const aspectKey = trimmed.substring(0, colonIndex).trim();
    const aspectType = ASPECT_TYPE_MAP[aspectKey];

    if (!aspectType) continue;

    const value = trimmed.substring(colonIndex + 1).trim();
    const parts = value.split('|').map(p => p.trim());

    if (parts.length !== 3) {
      console.warn(`Invalid line format: ${trimmed}`);
      continue;
    }

    const [englishPrompt, chineseAnswer, pinyin] = parts;

    items.push({
      id: `ta_${String(itemIndex).padStart(3, '0')}`,
      baseScenario: currentBase || 'unknown',
      aspectType,
      englishPrompt,
      chineseAnswer,
      pinyin,
      markers: ASPECT_MARKERS[aspectType],
    });

    itemIndex++;
  }

  return items;
}

/**
 * Loads tense/aspect items from the corpus file.
 */
export async function loadTenseAspectItems(): Promise<TenseAspectItem[]> {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}docs/tense_aspect.txt`);
    if (!response.ok) {
      console.warn('Tense/aspect corpus not found');
      return [];
    }
    const content = await response.text();
    return parseTenseAspectCorpus(content);
  } catch (error) {
    console.error('Failed to load tense/aspect corpus:', error);
    return [];
  }
}

/**
 * Filters items by selected aspect types.
 */
export function filterByAspectTypes(
  items: TenseAspectItem[],
  selectedAspects: AspectType[]
): TenseAspectItem[] {
  if (selectedAspects.length === 0) {
    return items;
  }
  return items.filter(item => selectedAspects.includes(item.aspectType));
}

/**
 * Shuffles an array using Fisher-Yates algorithm.
 */
export function shuffleItems<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get count of items per aspect type.
 */
export function getCountsByAspectType(
  items: TenseAspectItem[]
): Record<AspectType, number> {
  const counts: Record<string, number> = {};

  for (const item of items) {
    counts[item.aspectType] = (counts[item.aspectType] || 0) + 1;
  }

  return counts as Record<AspectType, number>;
}
