import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useExercise } from '../contexts/ExerciseContext';
import { loadResponseDatabase, generateVocabularyId } from '../lib/responseTracking/storage';

import { getVocabularyMasteryInfo } from '../lib/dashboard/mastery';
import { loadVocabularySelection, saveVocabularySelection } from '../lib/vocabularySelection';
import type { ResponseDatabase } from '../types/responseTracking';
import type { VocabularyEntry } from '../types/vocabulary';
import type { MasteryLevel, VocabularyMasteryInfo } from '../types/dashboard';
import { ALL_PROMPT_TYPES, PROMPT_TYPE_CONFIG, MASTERY_COLORS } from '../types/dashboard';

/**
 * Editable meaning cell component
 */
function EditableMeaning({
  entry,
  onSave,
}: {
  entry: VocabularyEntry;
  onSave: (newMeaning: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(entry.meaning);
  const [showOriginal, setShowOriginal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== entry.meaning) {
      onSave(trimmed);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(entry.meaning);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="w-full px-2 py-1 text-sm border-2 border-blue-500 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
      />
    );
  }

  return (
    <div className="group relative">
      <div
        className="flex items-center gap-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded px-1 -mx-1 py-0.5"
        onClick={() => setIsEditing(true)}
        title="Click to edit"
      >
        <span className="text-gray-700 dark:text-gray-300">{entry.meaning}</span>
        <span className="opacity-0 group-hover:opacity-100 text-gray-400 dark:text-gray-500 text-xs transition-opacity">
          edit
        </span>
        {entry.isEdited && (
          <span className="text-xs text-blue-500 dark:text-blue-400" title="Edited">*</span>
        )}
      </div>
      {entry.originalMeaning && entry.originalMeaning !== entry.meaning && (
        <div className="mt-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowOriginal(!showOriginal);
            }}
            className="text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            {showOriginal ? 'Hide original' : 'Show original'}
          </button>
          {showOriginal && (
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 p-2 rounded max-h-24 overflow-y-auto">
              {entry.originalMeaning}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type SortField = 'pinyin' | 'accuracy' | 'attempts' | 'lastPracticed' | 'promptTypes';
type SortDirection = 'asc' | 'desc';

interface SortState {
  field: SortField;
  direction: SortDirection;
}

interface VocabularyWithStats extends VocabularyEntry {
  originalIndex: number; // Index in the original vocabulary array
  vocabId: string;
  accuracy: number;
  totalAttempts: number;
  lastPracticed: number | null;
  masteryInfo: VocabularyMasteryInfo;
  totalMasteryPercent: number; // Sum of all skill mastery percentages
}

/**
 * Get accuracy color class
 */
function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 80) return 'text-green-600 dark:text-green-400';
  if (accuracy >= 60) return 'text-yellow-600 dark:text-yellow-400';
  if (accuracy >= 40) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
}


/**
 * Get the dot color for a prompt type mastery level
 */
function getPromptTypeDotColor(level: MasteryLevel): string {
  return MASTERY_COLORS[level];
}

/**
 * Prompt type mastery dots component
 */
function PromptTypeDots({ masteryInfo }: { masteryInfo: VocabularyMasteryInfo }) {
  return (
    <div className="flex items-center gap-1">
      {ALL_PROMPT_TYPES.map((pt) => {
        const info = masteryInfo.byPromptType[pt];
        const config = PROMPT_TYPE_CONFIG[pt];
        const dotColor = getPromptTypeDotColor(info.masteryLevel);

        return (
          <div
            key={pt}
            className="w-2.5 h-2.5 rounded-full transition-all duration-300 hover:scale-125 cursor-help"
            style={{
              backgroundColor: dotColor,
              boxShadow: info.masteryLevel === 'mastered' ? `0 0 6px ${dotColor}` : 'none'
            }}
            title={`${config.label}: ${info.masteryLevel} (${Math.round(info.accuracy)}% accuracy, ${info.totalAttempts} attempts)`}
          />
        );
      })}
    </div>
  );
}

/**
 * Format last practiced time
 */
function formatLastPracticed(timestamp: number | null): string {
  if (!timestamp) return '—';

  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;

  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Sort icon component
 */
function SortIcon({ active, direction }: { active: boolean; direction: SortDirection }) {
  return (
    <span className={`ml-1 inline-block transition-colors ${active ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}>
      {active ? (
        direction === 'asc' ? '↑' : '↓'
      ) : (
        '↕'
      )}
    </span>
  );
}

export function ViewVocabulary() {
  const { state, dispatch } = useExercise();
  const [searchQuery, setSearchQuery] = useState('');
  const [responseDatabase, setResponseDatabase] = useState<ResponseDatabase | null>(null);
  const [sort, setSort] = useState<SortState>({ field: 'pinyin', direction: 'asc' });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => loadVocabularySelection());

  // Reload database whenever this component is shown
  useEffect(() => {
    loadResponseDatabase().then(db => {
      setResponseDatabase(db);
    });
  }, [state.screen]); // Reload when screen changes (including when returning to this view)

  const handleBackToMenu = () => {
    dispatch({ type: 'BACK_TO_MENU' });
  };

  const handleSort = (field: SortField) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Compute vocabulary with stats
  const vocabularyWithStats = useMemo<VocabularyWithStats[]>(() => {
    if (!state.vocabulary) return [];

    return state.vocabulary.active.map((entry, index) => {
      const vocabId = generateVocabularyId(entry.word, entry.pinyin, entry.meaning);

      // Get full mastery info including per-prompt-type mastery
      const masteryInfo = getVocabularyMasteryInfo(entry, responseDatabase);

      // Calculate total mastery percent: sum of all 4 skill mastery percentages
      // Each skill contributes 0-100 based on: mastered=100, learning=50, struggling=10, new=0
      const totalMasteryPercent = ALL_PROMPT_TYPES.reduce((sum, pt) => {
        const level = masteryInfo.byPromptType[pt].masteryLevel;
        const levelValue = level === 'mastered' ? 100 : level === 'learning' ? 50 : level === 'struggling' ? 10 : 0;
        return sum + levelValue;
      }, 0);

      return {
        ...entry,
        originalIndex: index,
        vocabId,
        accuracy: masteryInfo.accuracy,
        totalAttempts: masteryInfo.totalAttempts,
        lastPracticed: masteryInfo.lastPracticed,
        masteryInfo,
        totalMasteryPercent
      };
    });
  }, [state.vocabulary, responseDatabase]);

  // Toggle selection for a single vocabulary item
  const toggleSelection = useCallback((vocabId: string) => {
    setSelectedIds(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(vocabId)) {
        newSelected.delete(vocabId);
      } else {
        newSelected.add(vocabId);
      }
      saveVocabularySelection(newSelected);
      return newSelected;
    });
  }, []);

  // Select all currently visible (filtered) vocabulary
  const handleSelectAll = useCallback(() => {
    setSelectedIds(prev => {
      const visibleIds = vocabularyWithStats.map(v => v.vocabId);
      const allVisible = visibleIds.every(id => prev.has(id));

      const newSelected = new Set(prev);
      if (allVisible) {
        // Deselect all visible
        visibleIds.forEach(id => newSelected.delete(id));
      } else {
        // Select all visible
        visibleIds.forEach(id => newSelected.add(id));
      }
      saveVocabularySelection(newSelected);
      return newSelected;
    });
  }, [vocabularyWithStats]);

  // Clear all selection
  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
    saveVocabularySelection(new Set());
  }, []);

  // Handle editing a vocabulary meaning
  const handleEditMeaning = useCallback((vocabIndex: number, newMeaning: string) => {
    if (!state.vocabulary) return;

    const updatedActive = state.vocabulary.active.map((entry, idx) => {
      if (idx === vocabIndex) {
        return {
          ...entry,
          // Store original if this is the first edit
          originalMeaning: entry.originalMeaning || entry.meaning,
          meaning: newMeaning,
          isEdited: true,
        };
      }
      return entry;
    });

    dispatch({
      type: 'SET_VOCABULARY',
      payload: {
        ...state.vocabulary,
        active: updatedActive,
      },
    });
  }, [state.vocabulary, dispatch]);

  // Filter vocabulary based on search query
  const filteredVocabulary = useMemo(() => {
    if (!searchQuery) return vocabularyWithStats;

    let query = searchQuery.toLowerCase();
    const endsWithHyphen = query.endsWith('-');

    // Check for prefix-based filtering
    if (query.startsWith('hz:')) {
      const searchTerm = query.slice(3);
      return vocabularyWithStats.filter(entry => {
        const word = entry.word.toLowerCase();
        return word.startsWith(searchTerm);
      });
    } else if (query.startsWith('py:')) {
      let searchTerm = query.slice(3);
      const exactMatch = searchTerm.endsWith('-');
      if (exactMatch) searchTerm = searchTerm.slice(0, -1);

      return vocabularyWithStats.filter(entry => {
        const pinyin = entry.pinyin.toLowerCase();
        if (exactMatch) {
          // Exact syllable match: match whole syllable at start or after space
          const syllables = pinyin.split(/\s+/);
          return syllables.some(s => s === searchTerm || s.match(new RegExp(`^${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\d*$`)));
        }
        return pinyin.startsWith(searchTerm) ||
               new RegExp(`[\\s,]${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(pinyin);
      });
    } else if (query.startsWith('en:')) {
      const searchTerm = query.slice(3);
      return vocabularyWithStats.filter(entry => {
        const meaning = entry.meaning.toLowerCase();
        return meaning.startsWith(searchTerm) ||
               new RegExp(`[\\s;]${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(meaning);
      });
    }

    // General search with optional exact syllable matching for pinyin
    if (endsWithHyphen) {
      const searchTerm = query.slice(0, -1);
      return vocabularyWithStats.filter(entry => {
        const word = entry.word.toLowerCase();
        const pinyin = entry.pinyin.toLowerCase();
        const meaning = entry.meaning.toLowerCase();

        // For pinyin: exact syllable match
        const syllables = pinyin.split(/\s+/);
        const pinyinMatch = syllables.some(s => s === searchTerm || s.match(new RegExp(`^${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\d*$`)));

        // For character and meaning: still do starts-with match
        const wordMatch = word.startsWith(searchTerm);
        const meaningMatch = meaning.startsWith(searchTerm) ||
                            new RegExp(`[\\s;]${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(meaning);

        return wordMatch || pinyinMatch || meaningMatch;
      });
    }

    // Default search without hyphen
    return vocabularyWithStats.filter(entry => {
      const word = entry.word.toLowerCase();
      const pinyin = entry.pinyin.toLowerCase();
      const meaning = entry.meaning.toLowerCase();

      const wordMatch = word.startsWith(query);
      const pinyinMatch = pinyin.startsWith(query) ||
                         new RegExp(`[\\s]${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(pinyin);
      const meaningMatch = meaning.startsWith(query) ||
                          new RegExp(`[\\s;]${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(meaning);

      return wordMatch || pinyinMatch || meaningMatch;
    });
  }, [vocabularyWithStats, searchQuery]);

  // Sort vocabulary
  const sortedVocabulary = useMemo(() => {
    const sorted = [...filteredVocabulary];

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sort.field) {
        case 'pinyin':
          comparison = a.pinyin.localeCompare(b.pinyin);
          break;
        case 'accuracy':
          // Items with no attempts go to the end
          if (a.totalAttempts === 0 && b.totalAttempts === 0) comparison = 0;
          else if (a.totalAttempts === 0) comparison = 1;
          else if (b.totalAttempts === 0) comparison = -1;
          else comparison = a.accuracy - b.accuracy;
          break;
        case 'attempts':
          comparison = a.totalAttempts - b.totalAttempts;
          break;
        case 'promptTypes': {
          // Sort by total mastery percentage (sum of all 4 skill mastery values)
          comparison = a.totalMasteryPercent - b.totalMasteryPercent;
          break;
        }
        case 'lastPracticed':
          // Items never practiced go to the end
          if (a.lastPracticed === null && b.lastPracticed === null) comparison = 0;
          else if (a.lastPracticed === null) comparison = 1;
          else if (b.lastPracticed === null) comparison = -1;
          else comparison = a.lastPracticed - b.lastPracticed;
          break;
      }

      return sort.direction === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [filteredVocabulary, sort]);

  if (!state.vocabulary) {
    return null;
  }

  const totalWords = vocabularyWithStats.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <div className="w-full max-w-7xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
          {/* Header */}
          <div className="mb-8 flex justify-center">
            <div className="w-full flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Active Vocabulary</h1>
              <button
                onClick={handleBackToMenu}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm font-medium"
              >
                ← Back to Menu
              </button>
            </div>
          </div>

          {/* Search Field */}
          <div className="mb-6">
            <div className="max-w-md mx-auto">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 text-center">
                Prefix with <span className="font-mono font-semibold">hz:</span> <span className="font-mono font-semibold">py:</span> <span className="font-mono font-semibold">en:</span> • Add <span className="font-mono font-semibold">-</span> for exact syllable match
              </p>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by character, pinyin, or meaning..."
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all"
                autoComplete="off"
                spellCheck="false"
              />
            </div>
          </div>

          {/* Vocabulary count and selection info */}
          <div className="mb-6 flex justify-center gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-4">
              <p className="text-center text-sm text-blue-800 dark:text-blue-200">
                <span className="font-semibold">
                  {searchQuery ? `Showing ${sortedVocabulary.length} of ${totalWords} words` : `Total words: ${totalWords}`}
                </span>
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/30 border-2 border-purple-200 dark:border-purple-700 rounded-xl p-4 flex items-center gap-3">
              <p className="text-center text-sm text-purple-800 dark:text-purple-200">
                <span className="font-semibold">
                  {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'None selected'}
                </span>
              </p>
              {selectedIds.size > 0 && (
                <button
                  onClick={handleClearSelection}
                  className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 underline"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Vocabulary Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700 border-b-2 border-gray-300 dark:border-gray-600">
                  <th className="text-center p-3 w-10">
                    <input
                      type="checkbox"
                      checked={vocabularyWithStats.length > 0 && vocabularyWithStats.every(v => selectedIds.has(v.vocabId))}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500 cursor-pointer"
                      title={vocabularyWithStats.every(v => selectedIds.has(v.vocabId)) ? "Deselect all" : "Select all"}
                    />
                  </th>
                  <th className="text-left p-3 font-semibold text-gray-900 dark:text-white w-28">Character</th>
                  <th
                    className="text-left p-3 font-semibold text-gray-900 dark:text-white w-32 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 select-none"
                    onClick={() => handleSort('pinyin')}
                  >
                    Pinyin
                    <SortIcon active={sort.field === 'pinyin'} direction={sort.direction} />
                  </th>
                  <th className="text-left p-3 font-semibold text-gray-900 dark:text-white min-w-[140px]">Meaning</th>
                  <th
                    className="text-center p-3 font-semibold text-gray-900 dark:text-white w-24 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 select-none"
                    onClick={() => handleSort('promptTypes')}
                    title="Per-skill mastery: 简→拼 | 繁→拼 | EN→拼 | 简→EN | 繁→EN | 拼→EN | 🔊→拼 | 🔊→EN"
                  >
                    Mastery
                    <SortIcon active={sort.field === 'promptTypes'} direction={sort.direction} />
                  </th>
                  <th
                    className="text-center p-3 font-semibold text-gray-900 dark:text-white w-20 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 select-none"
                    onClick={() => handleSort('accuracy')}
                    title="Average accuracy across all attempts"
                  >
                    Acc.
                    <SortIcon active={sort.field === 'accuracy'} direction={sort.direction} />
                  </th>
                  <th
                    className="text-center p-3 font-semibold text-gray-900 dark:text-white w-16 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 select-none"
                    onClick={() => handleSort('attempts')}
                    title="Total number of attempts"
                  >
                    #
                    <SortIcon active={sort.field === 'attempts'} direction={sort.direction} />
                  </th>
                  <th
                    className="text-center p-3 font-semibold text-gray-900 dark:text-white w-24 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 select-none"
                    onClick={() => handleSort('lastPracticed')}
                    title="Last practiced"
                  >
                    Last
                    <SortIcon active={sort.field === 'lastPracticed'} direction={sort.direction} />
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedVocabulary.length > 0 ? (
                  sortedVocabulary.map((entry, index) => {
                    const { accuracy, totalAttempts, lastPracticed } = entry;

                    return (
                      <tr
                        key={index}
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="text-center p-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(entry.vocabId)}
                            onChange={() => toggleSelection(entry.vocabId)}
                            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-3 text-2xl text-gray-900 dark:text-white whitespace-nowrap">{entry.word}</td>
                        <td className="p-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">{entry.pinyin}</td>
                        <td className="p-3 min-w-[200px]">
                          <EditableMeaning
                            entry={entry}
                            onSave={(newMeaning) => handleEditMeaning(entry.originalIndex, newMeaning)}
                          />
                        </td>
                        <td className="p-3">
                          <div className="flex justify-center">
                            <PromptTypeDots masteryInfo={entry.masteryInfo} />
                          </div>
                        </td>
                        <td className={`p-3 text-center font-semibold ${totalAttempts > 0 ? getAccuracyColor(accuracy) : 'text-gray-400 dark:text-gray-500'}`}>
                          {totalAttempts > 0 ? `${Math.round(accuracy)}%` : '—'}
                        </td>
                        <td className="p-3 text-center text-gray-700 dark:text-gray-300">
                          {totalAttempts > 0 ? totalAttempts : '—'}
                        </td>
                        <td className="p-3 text-center text-gray-500 dark:text-gray-400 text-xs">
                          {formatLastPracticed(lastPracticed)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500 dark:text-gray-400">
                      No matching vocabulary found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}
