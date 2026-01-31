/**
 * Vocabulary Merge on Upload
 *
 * When a new vocabulary file is uploaded, merge it with the existing vocabulary
 * to preserve user's in-app meaning edits.
 */

import type { VocabularyEntry } from '../types/vocabulary';

/**
 * Build a lookup key for matching entries between old and new vocabulary.
 * Uses word + pinyin + occurrence index to handle duplicate word+pinyin pairs
 * (e.g., 家 jia1 "home" and 家 jia1 "measure word").
 */
function buildPositionalKey(entry: VocabularyEntry, occurrenceIndex: number): string {
  return `${entry.word}:${entry.pinyin}:${occurrenceIndex}`;
}

/**
 * Build a map from positional keys to entries.
 * Tracks how many times each word+pinyin pair has been seen to assign occurrence indices.
 */
function buildEntryMap(entries: VocabularyEntry[]): Map<string, VocabularyEntry> {
  const map = new Map<string, VocabularyEntry>();
  const occurrenceCounts = new Map<string, number>();

  for (const entry of entries) {
    const baseKey = `${entry.word}:${entry.pinyin}`;
    const count = occurrenceCounts.get(baseKey) || 0;
    occurrenceCounts.set(baseKey, count + 1);

    const key = buildPositionalKey(entry, count);
    map.set(key, entry);
  }

  return map;
}

/**
 * Merge new vocabulary entries with existing (old) entries, preserving user edits.
 *
 * Merge rules (match by word + pinyin + position among duplicates):
 * - If old entry was edited (isEdited) and new file meaning matches originalMeaning:
 *   Keep user's edit (meaning, originalMeaning, isEdited)
 * - If old entry was edited but new file meaning differs from originalMeaning:
 *   Use new file's meaning, clear isEdited/originalMeaning (source file changed)
 * - If old entry was not edited: Use new file's definition
 * - If entry is new (not in old data): Add as-is
 */
export function mergeVocabulary(
  oldEntries: VocabularyEntry[],
  newEntries: VocabularyEntry[]
): VocabularyEntry[] {
  const oldMap = buildEntryMap(oldEntries);

  // Track occurrence counts for new entries to match positions
  const occurrenceCounts = new Map<string, number>();

  return newEntries.map(newEntry => {
    const baseKey = `${newEntry.word}:${newEntry.pinyin}`;
    const count = occurrenceCounts.get(baseKey) || 0;
    occurrenceCounts.set(baseKey, count + 1);

    const key = buildPositionalKey(newEntry, count);
    const oldEntry = oldMap.get(key);

    if (!oldEntry) {
      // New entry not in old data — add as-is
      return newEntry;
    }

    if (!oldEntry.isEdited) {
      // Old entry was not edited — use new file's definition
      return newEntry;
    }

    // Old entry was edited by user
    if (oldEntry.originalMeaning === newEntry.meaning) {
      // New file has the same meaning as before the edit — keep user's edit
      return {
        ...newEntry,
        meaning: oldEntry.meaning,
        originalMeaning: oldEntry.originalMeaning,
        isEdited: true,
      };
    }

    // New file has a different meaning than the original — source file changed
    // Use new file's definition, clear edit tracking
    return {
      ...newEntry,
      originalMeaning: undefined,
      isEdited: undefined,
    };
  });
}
