/**
 * Vocabulary Filter Types
 *
 * Filter vocabulary entries based on performance data for targeted practice
 */

import type { PromptType } from './responseTracking';

/**
 * Available filter types for vocabulary selection
 */
export type VocabularyFilterType =
  | 'all'                    // No filtering - use all vocabulary
  | 'never-attempted'        // No recorded attempts
  | 'recent-failures'        // Last attempt was incorrect
  | 'low-accuracy'           // Success rate below threshold
  | 'stale'                  // Not practiced in X days
  | 'slow'                   // Response time above threshold
  | 'new-additions';         // Items near end of vocabulary list (newer)

/**
 * Configuration for a vocabulary filter
 */
export interface VocabularyFilterConfig {
  type: VocabularyFilterType;

  // For 'low-accuracy' filter: minimum accuracy percentage (0-100)
  accuracyThreshold?: number;

  // For 'stale' filter: number of days since last practice
  staleDays?: number;

  // For 'slow' filter: response time threshold in ms (per word)
  speedThresholdMs?: number;

  // For 'new-additions' filter: number of items from end of list to consider "new"
  newItemCount?: number;

  // Optional: filter by specific prompt type (e.g., only character-to-pinyin)
  promptType?: PromptType | 'any';
}

/**
 * Default filter configurations
 */
export const DEFAULT_FILTER_CONFIGS: Record<VocabularyFilterType, VocabularyFilterConfig> = {
  'all': { type: 'all' },
  'never-attempted': { type: 'never-attempted', promptType: 'any' },
  'recent-failures': { type: 'recent-failures', promptType: 'any' },
  'low-accuracy': { type: 'low-accuracy', accuracyThreshold: 70, promptType: 'any' },
  'stale': { type: 'stale', staleDays: 3, promptType: 'any' },
  'slow': { type: 'slow', speedThresholdMs: 3000, promptType: 'any' },
  'new-additions': { type: 'new-additions', newItemCount: 20 },
};

/**
 * Human-readable labels for filter types
 */
export const FILTER_LABELS: Record<VocabularyFilterType, string> = {
  'all': 'All Vocabulary',
  'never-attempted': 'Never Attempted',
  'recent-failures': 'Recent Failures',
  'low-accuracy': 'Low Accuracy',
  'stale': 'Not Practiced Recently',
  'slow': 'Slow Response',
  'new-additions': 'New Additions',
};

/**
 * Descriptions for filter types
 */
export const FILTER_DESCRIPTIONS: Record<VocabularyFilterType, string> = {
  'all': 'Practice with your entire vocabulary',
  'never-attempted': 'Items you haven\'t practiced yet',
  'recent-failures': 'Items where your last attempt was incorrect',
  'low-accuracy': 'Items with accuracy below threshold',
  'stale': 'Items not practiced in several days',
  'slow': 'Items where your response time is slow',
  'new-additions': 'Recently added vocabulary items',
};

/**
 * Saved filter preferences per exercise type
 */
export interface SavedFilterPreferences {
  // Key format: exerciseType or 'similar-characters'
  [exerciseKey: string]: VocabularyFilterConfig;
}
