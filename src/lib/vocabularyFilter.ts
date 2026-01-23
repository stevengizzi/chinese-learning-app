/**
 * Vocabulary Filter Utilities
 *
 * Functions to filter vocabulary entries based on performance data
 */

import type { VocabularyEntry } from '../types/vocabulary';
import type { ResponseDatabase, PromptType } from '../types/responseTracking';
import type { VocabularyFilterConfig, VocabularyFilterType, SavedFilterPreferences, SkillMasteryFilter } from '../types/vocabularyFilter';
import { generateVocabularyId, calculateSpeedThreshold } from './responseTracking/storage';
import { getVocabularyMasteryInfo } from './dashboard/mastery';
import { ALL_PROMPT_TYPES } from '../types/dashboard';

const FILTER_PREFERENCES_KEY = 'vocabulary-filter-preferences';

/**
 * Load saved filter preferences from localStorage
 */
export function loadFilterPreferences(): SavedFilterPreferences {
  try {
    const saved = localStorage.getItem(FILTER_PREFERENCES_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.warn('Failed to load filter preferences:', error);
  }
  return {};
}

/**
 * Save filter preferences to localStorage
 */
export function saveFilterPreferences(preferences: SavedFilterPreferences): void {
  try {
    localStorage.setItem(FILTER_PREFERENCES_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.warn('Failed to save filter preferences:', error);
  }
}

/**
 * Get filter config for a specific exercise key
 */
export function getFilterForExercise(exerciseKey: string): VocabularyFilterConfig | null {
  const preferences = loadFilterPreferences();
  return preferences[exerciseKey] || null;
}

/**
 * Save filter config for a specific exercise key
 */
export function saveFilterForExercise(exerciseKey: string, config: VocabularyFilterConfig): void {
  const preferences = loadFilterPreferences();
  preferences[exerciseKey] = config;
  saveFilterPreferences(preferences);
}

/**
 * Clear filter for a specific exercise key
 */
export function clearFilterForExercise(exerciseKey: string): void {
  const preferences = loadFilterPreferences();
  delete preferences[exerciseKey];
  saveFilterPreferences(preferences);
}

/**
 * Check if a vocabulary entry passes the skill mastery filter
 */
function entryPassesSkillMasteryFilter(
  entry: VocabularyEntry,
  skillFilter: SkillMasteryFilter,
  database: ResponseDatabase | null
): boolean {
  const masteryInfo = getVocabularyMasteryInfo(entry, database);

  // Check each prompt type - entry passes if it matches at least one selected level for each prompt type
  for (const pt of ALL_PROMPT_TYPES) {
    const ptMastery = masteryInfo.byPromptType[pt].masteryLevel;
    const allowedLevels = skillFilter[pt];

    // If no levels are selected for this prompt type, it means "don't filter by this"
    // But if levels are selected and this entry's level isn't included, filter it out
    if (allowedLevels.length > 0 && allowedLevels.length < 4 && !allowedLevels.includes(ptMastery)) {
      return false;
    }
  }

  return true;
}

/**
 * Check if a vocabulary entry passes the filter criteria
 */
function entryPassesFilter(
  entry: VocabularyEntry,
  index: number,
  totalEntries: number,
  config: VocabularyFilterConfig,
  database: ResponseDatabase | null
): boolean {
  // First check skill mastery filter if present and not all selected
  if (config.skillMasteryFilter) {
    const isDefaultFilter = ALL_PROMPT_TYPES.every(pt =>
      config.skillMasteryFilter![pt].length === 4
    );
    if (!isDefaultFilter && !entryPassesSkillMasteryFilter(entry, config.skillMasteryFilter, database)) {
      return false;
    }
  }

  if (config.type === 'all') {
    return true;
  }

  const vocabId = generateVocabularyId(entry.word, entry.pinyin, entry.meaning);
  const stats = database?.statistics[vocabId];

  // Determine which prompt type stats to use
  const promptType = config.promptType;
  const useAnyPromptType = !promptType || promptType === 'any';

  switch (config.type) {
    case 'never-attempted': {
      if (!stats) return true;
      if (useAnyPromptType) {
        return stats.totalAttempts === 0;
      }
      const promptStats = stats.byPromptType?.[promptType as PromptType];
      return !promptStats || promptStats.totalAttempts === 0;
    }

    case 'recent-failures': {
      if (!stats) return false; // Can't have failed if never attempted
      if (useAnyPromptType) {
        // Check if the most recent attempt across all prompt types was a failure
        // We need to look at the raw records for this
        if (!database) return false;
        const recentRecords = database.records
          .filter(r => r.vocabularyId === vocabId)
          .sort((a, b) => b.timestamp - a.timestamp);
        if (recentRecords.length === 0) return false;
        return !recentRecords[0].wasCorrect;
      }
      // For specific prompt type, check the most recent record of that type
      if (!database) return false;
      const promptRecords = database.records
        .filter(r => r.vocabularyId === vocabId && r.promptType === promptType)
        .sort((a, b) => b.timestamp - a.timestamp);
      if (promptRecords.length === 0) return false;
      return !promptRecords[0].wasCorrect;
    }

    case 'low-accuracy': {
      const threshold = config.accuracyThreshold ?? 70;
      if (!stats) return true; // No data = needs practice
      if (useAnyPromptType) {
        if (stats.totalAttempts === 0) return true;
        const accuracy = (stats.correctAttempts / stats.totalAttempts) * 100;
        return accuracy < threshold;
      }
      const promptStats = stats.byPromptType?.[promptType as PromptType];
      if (!promptStats || promptStats.totalAttempts === 0) return true;
      const accuracy = (promptStats.correctAttempts / promptStats.totalAttempts) * 100;
      return accuracy < threshold;
    }

    case 'stale': {
      const staleDays = config.staleDays ?? 3;
      const staleMs = staleDays * 24 * 60 * 60 * 1000;
      const now = Date.now();

      if (!stats) return true; // Never attempted = definitely stale
      if (useAnyPromptType) {
        if (stats.lastAttemptTimestamp === 0) return true;
        return (now - stats.lastAttemptTimestamp) > staleMs;
      }
      const promptStats = stats.byPromptType?.[promptType as PromptType];
      if (!promptStats || promptStats.lastAttemptTimestamp === 0) return true;
      return (now - promptStats.lastAttemptTimestamp) > staleMs;
    }

    case 'slow': {
      const speedThreshold = config.speedThresholdMs ?? 3000;
      if (!stats) return true; // No data = include (needs practice)
      if (stats.correctAttempts === 0) return true; // No correct answers yet

      if (useAnyPromptType) {
        // Use overall average and compare to word-count-adjusted threshold
        const adjustedThreshold = calculateSpeedThreshold(stats.wordCount) / stats.wordCount;
        return stats.averageResponseTimeMs > Math.min(speedThreshold, adjustedThreshold);
      }
      const promptStats = stats.byPromptType?.[promptType as PromptType];
      if (!promptStats || promptStats.correctAttempts === 0) return true;
      const adjustedThreshold = calculateSpeedThreshold(stats.wordCount) / stats.wordCount;
      return promptStats.averageResponseTimeMs > Math.min(speedThreshold, adjustedThreshold);
    }

    case 'new-additions': {
      const newItemCount = config.newItemCount ?? 20;
      // Items near the end of the list are considered "new"
      return index >= (totalEntries - newItemCount);
    }

    default:
      return true;
  }
}

/**
 * Filter vocabulary entries based on the given configuration
 * Returns filtered entries along with their original indices
 */
export function filterVocabulary(
  vocabulary: VocabularyEntry[],
  config: VocabularyFilterConfig,
  database: ResponseDatabase | null
): VocabularyEntry[] {
  if (config.type === 'all') {
    return vocabulary;
  }

  return vocabulary.filter((entry, index) =>
    entryPassesFilter(entry, index, vocabulary.length, config, database)
  );
}

/**
 * Count how many vocabulary entries pass the filter
 */
export function countFilteredVocabulary(
  vocabulary: VocabularyEntry[],
  config: VocabularyFilterConfig,
  database: ResponseDatabase | null
): number {
  if (config.type === 'all') {
    return vocabulary.length;
  }

  return vocabulary.filter((entry, index) =>
    entryPassesFilter(entry, index, vocabulary.length, config, database)
  ).length;
}

/**
 * Get counts for all filter types (for displaying in UI)
 */
export function getAllFilterCounts(
  vocabulary: VocabularyEntry[],
  database: ResponseDatabase | null
): Record<VocabularyFilterType, number> {
  const filterTypes: VocabularyFilterType[] = [
    'all',
    'never-attempted',
    'recent-failures',
    'low-accuracy',
    'stale',
    'slow',
    'new-additions'
  ];

  const counts: Record<VocabularyFilterType, number> = {} as Record<VocabularyFilterType, number>;

  for (const type of filterTypes) {
    const config: VocabularyFilterConfig = {
      type,
      // Use default values
      accuracyThreshold: 70,
      staleDays: 3,
      speedThresholdMs: 3000,
      newItemCount: 20,
      promptType: 'any'
    };
    counts[type] = countFilteredVocabulary(vocabulary, config, database);
  }

  return counts;
}

/**
 * Map exercise type to prompt type for filtering
 */
export function getPromptTypeForExercise(exerciseType: string): PromptType | 'any' {
  switch (exerciseType) {
    case 'character-to-pinyin':
      return 'character-to-pinyin';
    case 'character-to-english':
      return 'character-to-english';
    case 'pinyin-to-english':
      return 'pinyin-to-english';
    case 'english-to-pinyin':
      return 'english-to-pinyin';
    case 'shuffled':
    case 'shuffled-to-english':
    default:
      return 'any';
  }
}
