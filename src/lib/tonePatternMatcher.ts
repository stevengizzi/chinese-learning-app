/**
 * Tone Pattern Matcher
 *
 * Core logic for loading vocabulary items from all sources and filtering
 * by tone patterns (considering tone sandhi for pronounced tones).
 */

import type { TonePatternItem, ToneSlotSelection } from '../types/tonePatternPractice';
import { parseSentenceCorpus } from './sentenceParser';
import { convertDiacriticToToneNumber, extractTonesFromNumberedPinyin } from './diacriticToToneNumber';
import { convertPinyinStringToToneMarks } from './pinyinToneConverter';
import { getPronouncedTones } from './toneSequence/toneSandhiRules';

/**
 * Extracts syllables (without tone numbers) from tone-number pinyin.
 * e.g., "wo3 jin1 tian1" -> ["wo", "jin", "tian"]
 */
function extractSyllables(pinyin: string): string[] {
  return pinyin
    .split(/\s+/)
    .map(s => s.replace(/\d+$/, '').toLowerCase())
    .filter(s => s.length > 0);
}

/**
 * Extracts tone numbers from tone-number pinyin.
 * e.g., "wo3 jin1 tian1" -> [3, 1, 1]
 */
function extractTones(pinyin: string): number[] {
  return extractTonesFromNumberedPinyin(pinyin);
}

/**
 * Checks if a tone sequence matches a pattern.
 * Each slot in the pattern can be 'any' or a Set of allowed tones.
 */
export function matchesPattern(pronouncedTones: number[], pattern: ToneSlotSelection[]): boolean {
  // Must be exact length match
  if (pronouncedTones.length !== pattern.length) {
    return false;
  }

  for (let i = 0; i < pattern.length; i++) {
    const slot = pattern[i];
    const tone = pronouncedTones[i];

    if (slot === 'any') {
      // Any tone matches
      continue;
    }

    // Check if tone is in the allowed set
    if (!slot.has(tone as 1 | 2 | 3 | 4 | 5)) {
      return false;
    }
  }

  return true;
}

/**
 * Parses HSK file content (diacritical pinyin format).
 */
function parseHskContent(content: string): Array<{ hanzi: string; pinyin: string; meaning: string }> {
  const items: Array<{ hanzi: string; pinyin: string; meaning: string }> = [];
  const blocks = content.split('--').filter(b => b.trim());

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    let english = '';
    let mandarin = '';
    let pinyin = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('english:')) {
        english = trimmed.substring(8).trim();
      } else if (trimmed.startsWith('mandarin:')) {
        mandarin = trimmed.substring(9).trim();
      } else if (trimmed.startsWith('pinyin:')) {
        pinyin = trimmed.substring(7).trim();
      }
    }

    if (mandarin && pinyin && english) {
      items.push({
        hanzi: mandarin,
        pinyin: pinyin,
        meaning: english,
      });
    }
  }

  return items;
}

/**
 * Loads all tone pattern items from all three data sources.
 */
export async function loadAllTonePatternItems(): Promise<TonePatternItem[]> {
  const items: TonePatternItem[] = [];
  const baseUrl = import.meta.env.BASE_URL || '/';

  // Load vocabulary from localStorage (uploaded by user)
  // and other sources from public/docs/ in parallel
  const [hskResponse, sentencesResponse] = await Promise.all([
    fetch(`${baseUrl}docs/hsk_1_4.txt`).catch(() => null),
    fetch(`${baseUrl}docs/sentences.txt`).catch(() => null),
  ]);

  // Process vocabulary from localStorage (user-uploaded file)
  try {
    const savedVocab = localStorage.getItem('vocabulary');
    if (savedVocab) {
      const vocabData = JSON.parse(savedVocab);
      if (vocabData?.active) {
        for (let i = 0; i < vocabData.active.length; i++) {
          const entry = vocabData.active[i];
          const syllables = extractSyllables(entry.pinyin);
          const originalTones = extractTones(entry.pinyin);
          const pronouncedTones = getPronouncedTones(originalTones, syllables);

          items.push({
            id: `vocab_${i}`,
            source: 'vocabulary',
            hanzi: entry.word,
            pinyin: entry.pinyin,
            pinyinWithMarks: convertPinyinStringToToneMarks(entry.pinyin),
            meaning: entry.meaning,
            pronouncedTones,
            originalTones,
            sandhiApplied: !arraysEqual(originalTones, pronouncedTones),
          });
        }
      }
    }
  } catch (error) {
    console.error('Failed to load vocabulary from localStorage:', error);
  }

  // Process HSK file (diacritical pinyin - needs conversion)
  if (hskResponse?.ok) {
    const content = await hskResponse.text();
    const hskItems = parseHskContent(content);

    for (let i = 0; i < hskItems.length; i++) {
      const entry = hskItems[i];
      // Convert diacritical pinyin to tone numbers
      const numberedPinyin = convertDiacriticToToneNumber(entry.pinyin);
      const syllables = extractSyllables(numberedPinyin);
      const originalTones = extractTones(numberedPinyin);
      const pronouncedTones = getPronouncedTones(originalTones, syllables);

      items.push({
        id: `hsk_${i}`,
        source: 'hsk',
        hanzi: entry.hanzi,
        pinyin: numberedPinyin,
        pinyinWithMarks: entry.pinyin, // Already has marks
        meaning: entry.meaning,
        pronouncedTones,
        originalTones,
        sandhiApplied: !arraysEqual(originalTones, pronouncedTones),
      });
    }
  }

  // Process sentences file
  if (sentencesResponse?.ok) {
    const content = await sentencesResponse.text();
    const sentences = parseSentenceCorpus(content);

    for (const sentence of sentences) {
      const syllables = extractSyllables(sentence.pinyin);
      const originalTones = extractTones(sentence.pinyin);
      const pronouncedTones = getPronouncedTones(originalTones, syllables);

      items.push({
        id: sentence.id,
        source: 'sentences',
        hanzi: sentence.hanzi,
        pinyin: sentence.pinyin,
        pinyinWithMarks: convertPinyinStringToToneMarks(sentence.pinyin),
        meaning: sentence.translations[0],
        pronouncedTones,
        originalTones,
        sandhiApplied: !arraysEqual(originalTones, pronouncedTones),
      });
    }
  }

  return items;
}

/**
 * Filters items by a tone pattern.
 */
export function filterByPattern(items: TonePatternItem[], pattern: ToneSlotSelection[]): TonePatternItem[] {
  return items.filter(item => matchesPattern(item.pronouncedTones, pattern));
}

/**
 * Counts items matching a pattern (for live UI updates).
 */
export function countMatchingItems(items: TonePatternItem[], pattern: ToneSlotSelection[]): number {
  return items.filter(item => matchesPattern(item.pronouncedTones, pattern)).length;
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
 * Helper to check array equality.
 */
function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
