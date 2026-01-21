import type { Sentence } from '../types/sentenceReading';

/**
 * Parses the sentence corpus file into Sentence objects.
 *
 * Expected format:
 * HANZI: 我今天打车回家。
 * PINYIN: wo3 jin1 tian1 da3 che1 hui2 jia1
 * TRANSLATIONS: I took a taxi home today. | Today I went home by taxi.
 * DIFFICULTY: 2
 *
 * Blocks are separated by blank lines. Lines starting with # are comments.
 */
export function parseSentenceCorpus(content: string): Sentence[] {
  const sentences: Sentence[] = [];
  const lines = content.split('\n');

  let currentBlock: {
    hanzi?: string;
    pinyin?: string;
    translations?: string[];
    difficulty?: number;
  } = {};

  let sentenceIndex = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (trimmed.startsWith('#') || trimmed === '' || trimmed.startsWith('=')) {
      // If we have a complete block, save it
      if (currentBlock.hanzi && currentBlock.pinyin && currentBlock.translations && currentBlock.difficulty) {
        sentences.push({
          id: `sent_${String(sentenceIndex).padStart(3, '0')}`,
          hanzi: currentBlock.hanzi,
          pinyin: currentBlock.pinyin,
          translations: currentBlock.translations,
          difficulty: currentBlock.difficulty as 1 | 2 | 3 | 4 | 5,
        });
        sentenceIndex++;
        currentBlock = {};
      }
      continue;
    }

    // Parse each line type
    if (trimmed.startsWith('HANZI:')) {
      currentBlock.hanzi = trimmed.substring(6).trim();
    } else if (trimmed.startsWith('PINYIN:')) {
      currentBlock.pinyin = trimmed.substring(7).trim();
    } else if (trimmed.startsWith('TRANSLATIONS:')) {
      const translationStr = trimmed.substring(13).trim();
      currentBlock.translations = translationStr.split('|').map(t => t.trim()).filter(t => t.length > 0);
    } else if (trimmed.startsWith('DIFFICULTY:')) {
      const diffStr = trimmed.substring(11).trim();
      const diff = parseInt(diffStr, 10);
      if (diff >= 1 && diff <= 5) {
        currentBlock.difficulty = diff;
      }
    }
  }

  // Don't forget the last block if file doesn't end with blank line
  if (currentBlock.hanzi && currentBlock.pinyin && currentBlock.translations && currentBlock.difficulty) {
    sentences.push({
      id: `sent_${String(sentenceIndex).padStart(3, '0')}`,
      hanzi: currentBlock.hanzi,
      pinyin: currentBlock.pinyin,
      translations: currentBlock.translations,
      difficulty: currentBlock.difficulty as 1 | 2 | 3 | 4 | 5,
    });
  }

  return sentences;
}

/**
 * Loads sentences from the corpus file.
 */
export async function loadSentences(): Promise<Sentence[]> {
  try {
    const response = await fetch('/docs/sentences.txt');
    if (!response.ok) {
      console.warn('Sentence corpus not found');
      return [];
    }
    const content = await response.text();
    return parseSentenceCorpus(content);
  } catch (error) {
    console.error('Failed to load sentence corpus:', error);
    return [];
  }
}

/**
 * Filters sentences by difficulty range.
 */
export function filterSentencesByDifficulty(
  sentences: Sentence[],
  minDifficulty: number,
  maxDifficulty: number
): Sentence[] {
  return sentences.filter(s => s.difficulty >= minDifficulty && s.difficulty <= maxDifficulty);
}

/**
 * Shuffles an array using Fisher-Yates algorithm.
 */
export function shuffleSentences<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
