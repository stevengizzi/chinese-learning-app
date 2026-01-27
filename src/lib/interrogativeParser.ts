/**
 * Interrogative (Question Word) Corpus Parser
 *
 * Parses the interrogatives.txt corpus file into InterrogativeItem objects.
 */

import type { InterrogativeItem, QuestionType } from '../types/interrogative';
import { QUESTION_MARKERS } from '../types/interrogative';

/**
 * Map from corpus question type names to QuestionType
 */
const QUESTION_TYPE_MAP: Record<string, QuestionType> = {
  'WHAT': 'what',
  'WHO': 'who',
  'WHERE': 'where',
  'WHICH': 'which',
  'WHEN_GENERAL': 'when_general',
  'WHEN_TIME': 'when_time',
  'WHEN_DAY': 'when_day',
  'WHEN_DATE': 'when_date',
  'WHY': 'why',
  'HOW_METHOD': 'how_method',
  'HOW_QUALITY': 'how_quality',
  'HOW_SUGGESTION': 'how_suggestion',
  'HOW_MUCH': 'how_much',
  'HOW_MANY': 'how_many',
  'HOW_ADJECTIVE': 'how_adjective',
};

/**
 * Parses the interrogative corpus file into InterrogativeItem objects.
 *
 * Expected format:
 * BASE: personal information
 * WHAT: What is your name? | 你叫什么名字？ | ni3 jiao4 shen2 me ming2 zi4
 * WHO: Who is he? | 他是谁？ | ta1 shi4 shei2
 * ...
 * ===
 *
 * Blocks are separated by ===. Lines starting with # are comments.
 */
export function parseInterrogativeCorpus(content: string): InterrogativeItem[] {
  const items: InterrogativeItem[] = [];
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

    // Parse question type lines
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;

    const questionKey = trimmed.substring(0, colonIndex).trim();
    const questionType = QUESTION_TYPE_MAP[questionKey];

    if (!questionType) continue;

    const value = trimmed.substring(colonIndex + 1).trim();
    const parts = value.split('|').map(p => p.trim());

    if (parts.length < 3) {
      console.warn(`Invalid line format: ${trimmed}`);
      continue;
    }

    const [englishPrompt, chineseAnswer, pinyin] = parts;
    const alternateAnswers = parts.length > 3 ? parts.slice(3) : undefined;

    items.push({
      id: `int_${String(itemIndex).padStart(3, '0')}`,
      baseScenario: currentBase || 'unknown',
      questionType,
      englishPrompt,
      chineseAnswer,
      pinyin,
      alternateAnswers,
      markers: QUESTION_MARKERS[questionType],
    });

    itemIndex++;
  }

  return items;
}

/**
 * Loads interrogative items from the corpus file.
 */
export async function loadInterrogativeItems(): Promise<InterrogativeItem[]> {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}docs/interrogatives.txt`);
    if (!response.ok) {
      console.warn('Interrogative corpus not found');
      return [];
    }
    const content = await response.text();
    return parseInterrogativeCorpus(content);
  } catch (error) {
    console.error('Failed to load interrogative corpus:', error);
    return [];
  }
}

/**
 * Filters items by selected question types.
 */
export function filterByQuestionTypes(
  items: InterrogativeItem[],
  selectedTypes: QuestionType[]
): InterrogativeItem[] {
  if (selectedTypes.length === 0) {
    return items;
  }
  return items.filter(item => selectedTypes.includes(item.questionType));
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
 * Get count of items per question type.
 */
export function getCountsByQuestionType(
  items: InterrogativeItem[]
): Record<QuestionType, number> {
  const counts: Record<string, number> = {};

  for (const item of items) {
    counts[item.questionType] = (counts[item.questionType] || 0) + 1;
  }

  return counts as Record<QuestionType, number>;
}
