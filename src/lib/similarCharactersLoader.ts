/**
 * Functions to load the similar characters database and generate exercise items.
 */

import type { VocabularyEntry } from '../types/vocabulary';
import type {
  SimilarCharactersDatabase,
  SimilarCharactersConfig,
  MultipleChoiceItem,
  PairDistinctionItem,
  SimilarCharacterGroup,
} from '../types/similarCharacters';

const DB_URL = `${import.meta.env.BASE_URL}data/similar-characters.json`;

/**
 * Load the similar characters database from the JSON file.
 */
export async function loadSimilarCharactersDatabase(): Promise<SimilarCharactersDatabase> {
  const response = await fetch(DB_URL);
  if (!response.ok) {
    throw new Error('Failed to load similar characters database');
  }
  return response.json();
}

/**
 * Extract single characters from a vocabulary entry's word.
 * For multi-character words, returns each character separately.
 */
function extractCharacters(word: string): string[] {
  return [...word].filter(char => /[\u4e00-\u9fff]/.test(char));
}

/**
 * Build a map of characters to their groups in the database.
 */
function buildCharacterToGroupMap(
  database: SimilarCharactersDatabase
): Map<string, SimilarCharacterGroup[]> {
  const map = new Map<string, SimilarCharacterGroup[]>();

  for (const group of database.groups) {
    for (const entry of group.characters) {
      const existing = map.get(entry.character) || [];
      existing.push(group);
      map.set(entry.character, existing);
    }
  }

  return map;
}

/**
 * Get all vocabulary characters that have similar character data.
 */
export function getVocabularyCharactersWithSimilars(
  vocabulary: VocabularyEntry[],
  database: SimilarCharactersDatabase
): Set<string> {
  const charToGroups = buildCharacterToGroupMap(database);
  const result = new Set<string>();

  for (const entry of vocabulary) {
    const chars = extractCharacters(entry.word);
    for (const char of chars) {
      if (charToGroups.has(char)) {
        result.add(char);
      }
    }
  }

  return result;
}

/**
 * Shuffle an array in place.
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Generate exercise items for Multiple Choice mode (Mode A).
 * Target characters come from vocabulary; distractors from the same confusion group.
 */
export function generateMultipleChoiceItems(
  database: SimilarCharactersDatabase,
  vocabulary: VocabularyEntry[],
  config: SimilarCharactersConfig
): MultipleChoiceItem[] {
  const charToGroups = buildCharacterToGroupMap(database);
  const items: MultipleChoiceItem[] = [];
  const usedCharacters = new Set<string>();

  // Collect all vocabulary characters that have similar character data
  for (const vocabEntry of vocabulary) {
    const chars = extractCharacters(vocabEntry.word);

    for (const targetChar of chars) {
      // Skip if already used
      if (usedCharacters.has(targetChar)) continue;

      const groups = charToGroups.get(targetChar);
      if (!groups || groups.length === 0) continue;

      // Filter by category if specified
      const filteredGroups = config.categories
        ? groups.filter(g => config.categories!.includes(g.category))
        : groups;

      if (filteredGroups.length === 0) continue;

      // Use the first matching group
      const group = filteredGroups[0];

      // Get the target character's data from the group
      const targetEntry = group.characters.find(c => c.character === targetChar);
      if (!targetEntry) continue;

      // Get other characters from the group as distractors
      const distractors = group.characters
        .filter(c => c.character !== targetChar)
        .slice(0, 3);

      // Need at least 1 distractor to make it meaningful
      if (distractors.length === 0) continue;

      // Build options (target + distractors)
      const allOptions = [targetEntry, ...distractors];
      const shuffledOptions = shuffleArray(allOptions);

      // Find correct index after shuffle
      const correctIndex = shuffledOptions.findIndex(
        o => o.character === targetChar
      );

      items.push({
        id: `mc-${targetChar}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        targetCharacter: targetChar,
        targetPinyin: targetEntry.pinyin,
        targetMeaning: targetEntry.meaning,
        options: shuffledOptions.map(o => o.character),
        optionsData: shuffledOptions,
        correctIndex,
        groupId: group.id,
        isFromVocabulary: true,
      });

      usedCharacters.add(targetChar);
    }
  }

  // Shuffle items if configured
  return config.shuffle ? shuffleArray(items) : items;
}

/**
 * Generate exercise items for Pair Distinction mode (Mode B).
 * Uses explicit confusion pairs from the database.
 */
export function generatePairDistinctionItems(
  database: SimilarCharactersDatabase,
  vocabulary: VocabularyEntry[],
  config: SimilarCharactersConfig
): PairDistinctionItem[] {
  const vocabChars = new Set<string>();
  for (const entry of vocabulary) {
    const chars = extractCharacters(entry.word);
    chars.forEach(c => vocabChars.add(c));
  }

  const items: PairDistinctionItem[] = [];
  const usedPairs = new Set<string>();

  for (const group of database.groups) {
    // Filter by category if specified
    if (config.categories && !config.categories.includes(group.category)) {
      continue;
    }

    for (const pair of group.confusionPairs) {
      // Skip if neither character is in vocabulary
      const aInVocab = vocabChars.has(pair.a);
      const bInVocab = vocabChars.has(pair.b);
      if (!aInVocab && !bInVocab) continue;

      // Create a unique key for this pair (sorted to avoid duplicates)
      const pairKey = [pair.a, pair.b].sort().join(':');
      if (usedPairs.has(pairKey)) continue;
      usedPairs.add(pairKey);

      // Get character data
      const dataA = group.characters.find(c => c.character === pair.a);
      const dataB = group.characters.find(c => c.character === pair.b);
      if (!dataA || !dataB) continue;

      // Randomly select which character is the target (prefer vocab characters)
      let targetChar: string;
      if (aInVocab && !bInVocab) {
        targetChar = pair.a;
      } else if (bInVocab && !aInVocab) {
        targetChar = pair.b;
      } else {
        targetChar = Math.random() < 0.5 ? pair.a : pair.b;
      }

      const targetData = targetChar === pair.a ? dataA : dataB;

      items.push({
        id: `pd-${pair.a}-${pair.b}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        characterA: pair.a,
        characterB: pair.b,
        dataA,
        dataB,
        targetCharacter: targetChar,
        targetPinyin: targetData.pinyin,
        targetMeaning: targetData.meaning,
        difficulty: pair.difficulty,
        groupId: group.id,
        isFromVocabulary: aInVocab || bInVocab,
      });
    }
  }

  // Shuffle items if configured
  return config.shuffle ? shuffleArray(items) : items;
}

/**
 * Count available items for a given configuration.
 */
export function countAvailableItems(
  database: SimilarCharactersDatabase,
  vocabulary: VocabularyEntry[],
  config: SimilarCharactersConfig
): { multipleChoice: number; pairDistinction: number } {
  const mcItems = generateMultipleChoiceItems(database, vocabulary, config);
  const pdItems = generatePairDistinctionItems(database, vocabulary, config);

  return {
    multipleChoice: mcItems.length,
    pairDistinction: pdItems.length,
  };
}

/**
 * Convert pinyin with tone numbers to display format with tone marks.
 */
export function formatPinyinForDisplay(pinyin: string): string {
  // Simple conversion - the app has a proper converter elsewhere
  // For now, just return as-is since the database already has tone numbers
  return pinyin;
}
