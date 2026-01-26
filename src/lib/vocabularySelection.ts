/**
 * Vocabulary Selection Storage
 *
 * Manages loading and saving vocabulary selection (checked/unchecked items)
 * for the "Selected Only" filter feature.
 */

const STORAGE_KEY = 'vocabulary-selection';
const CURRENT_VERSION = 1;

interface VocabularySelectionData {
  version: number;
  selectedIds: string[];
  lastUpdated: number;
}

/**
 * Load vocabulary selection from localStorage
 */
export function loadVocabularySelection(): Set<string> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data: VocabularySelectionData = JSON.parse(saved);
      return new Set(data.selectedIds);
    }
  } catch (error) {
    console.warn('Failed to load vocabulary selection:', error);
  }
  return new Set();
}

/**
 * Save vocabulary selection to localStorage
 */
export function saveVocabularySelection(selectedIds: Set<string>): void {
  try {
    const data: VocabularySelectionData = {
      version: CURRENT_VERSION,
      selectedIds: Array.from(selectedIds),
      lastUpdated: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save vocabulary selection:', error);
  }
}

/**
 * Check if a vocabulary item is selected
 */
export function isVocabularySelected(vocabId: string): boolean {
  const selection = loadVocabularySelection();
  return selection.has(vocabId);
}

/**
 * Get the count of selected vocabulary items
 */
export function getSelectedCount(): number {
  const selection = loadVocabularySelection();
  return selection.size;
}

/**
 * Clear all selection
 */
export function clearSelection(): void {
  saveVocabularySelection(new Set());
}
