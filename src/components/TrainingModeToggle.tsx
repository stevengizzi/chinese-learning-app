import { useState, useEffect } from 'react';
import type { VocabularyEntry } from '../types/vocabulary';
import type { ResponseDatabase } from '../types/responseTracking';
import { countItemsNeedingWork } from '../lib/trainingPriority';

interface TrainingModeToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  vocabulary: VocabularyEntry[];
  database: ResponseDatabase | null;
}

const STORAGE_KEY = 'focusOnWeaknesses';

/**
 * Toggle component for enabling "Focus on Weaknesses" training mode
 */
export function TrainingModeToggle({
  enabled,
  onChange,
  vocabulary,
  database,
}: TrainingModeToggleProps) {
  const [itemsNeedingWork, setItemsNeedingWork] = useState<number | null>(null);

  // Calculate items needing work when database or vocabulary changes
  useEffect(() => {
    if (!database || vocabulary.length === 0) {
      setItemsNeedingWork(null);
      return;
    }

    // Use character-to-pinyin as a representative prompt type for the count
    // (the actual filtering happens per-exercise with the correct prompt type)
    const count = countItemsNeedingWork(vocabulary, database, 'character-to-pinyin');
    setItemsNeedingWork(count);
  }, [database, vocabulary]);

  // Persist setting to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(enabled));
  }, [enabled]);

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-700 rounded-xl p-4">
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={e => onChange(e.target.checked)}
          className="w-5 h-5 rounded accent-amber-600"
        />
        <div className="flex-1">
          <span className="text-gray-900 dark:text-white font-semibold">
            Focus on Weaknesses
          </span>
          {itemsNeedingWork !== null && (
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-0.5">
              {itemsNeedingWork} {itemsNeedingWork === 1 ? 'item needs' : 'items need'} more practice
            </p>
          )}
        </div>
      </label>
    </div>
  );
}

/**
 * Load saved focus mode preference from localStorage
 */
export function loadFocusModePreference(): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : false;
  } catch {
    return false;
  }
}
