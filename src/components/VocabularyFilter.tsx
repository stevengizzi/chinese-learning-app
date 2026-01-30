import { useState, useEffect } from 'react';
import type { VocabularyEntry } from '../types/vocabulary';
import type { ResponseDatabase, PromptType } from '../types/responseTracking';
import type { VocabularyFilterConfig, VocabularyFilterType, MasteryLevelsByPromptType } from '../types/vocabularyFilter';
import { FILTER_LABELS, FILTER_DESCRIPTIONS, DEFAULT_FILTER_CONFIGS, DEFAULT_MASTERY_LEVELS } from '../types/vocabularyFilter';
import { countFilteredVocabulary, getFilterForExercise, saveFilterForExercise, clearFilterForExercise, getPromptTypesForExercise } from '../lib/vocabularyFilter';
import { PROMPT_TYPE_CONFIG, MASTERY_COLORS } from '../types/dashboard';
import type { MasteryLevel } from '../types/dashboard';
import type { CharacterSet } from '../lib/characterConverter';

interface VocabularyFilterProps {
  exerciseKey: string;
  vocabulary: VocabularyEntry[];
  database: ResponseDatabase | null;
  onFilterChange: (config: VocabularyFilterConfig) => void;
  showRememberOption?: boolean;
  characterSet?: CharacterSet;
}

export function VocabularyFilter({
  exerciseKey,
  vocabulary,
  database,
  onFilterChange,
  showRememberOption = true,
  characterSet,
}: VocabularyFilterProps) {
  // Get the prompt types for this exercise (may be 1 or 2)
  const exercisePromptTypes = getPromptTypesForExercise(exerciseKey, characterSet);
  const hasPromptTypes = exercisePromptTypes.length > 0;

  // Build initial mastery levels by prompt type
  const buildDefaultMasteryByPT = (): MasteryLevelsByPromptType => {
    const result: MasteryLevelsByPromptType = {};
    for (const pt of exercisePromptTypes) {
      result[pt] = [...DEFAULT_MASTERY_LEVELS];
    }
    return result;
  };

  const [selectedFilter, setSelectedFilter] = useState<VocabularyFilterType>('all');
  const [config, setConfig] = useState<VocabularyFilterConfig>(() => ({
    type: 'all',
    masteryLevelsByPromptType: buildDefaultMasteryByPT()
  }));
  const [rememberFilter, setRememberFilter] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Load saved filter preference on mount or when exerciseKey changes
  useEffect(() => {
    const savedConfig = getFilterForExercise(exerciseKey);
    if (savedConfig) {
      setSelectedFilter(savedConfig.type);
      // Migrate old format or use saved masteryLevelsByPromptType
      const masteryByPT = savedConfig.masteryLevelsByPromptType || buildDefaultMasteryByPT();
      setConfig({
        ...savedConfig,
        masteryLevelsByPromptType: masteryByPT
      });
      setRememberFilter(true);
      onFilterChange({
        ...savedConfig,
        masteryLevelsByPromptType: masteryByPT
      });
    }
  }, [exerciseKey]);

  // Rebuild mastery filter keys when characterSet changes
  useEffect(() => {
    const newMasteryByPT = buildDefaultMasteryByPT();
    setConfig(prev => ({
      ...prev,
      masteryLevelsByPromptType: newMasteryByPT
    }));
    // Also notify parent of updated config
    onFilterChange({
      ...config,
      masteryLevelsByPromptType: newMasteryByPT
    });
  }, [characterSet]);

  // Calculate counts for each filter type
  const filterCounts: Record<VocabularyFilterType, number> = {
    'all': vocabulary.length,
    'selected-only': countFilteredVocabulary(vocabulary, { ...DEFAULT_FILTER_CONFIGS['selected-only'] }, database),
    'never-attempted': countFilteredVocabulary(vocabulary, { ...DEFAULT_FILTER_CONFIGS['never-attempted'] }, database),
    'recent-failures': countFilteredVocabulary(vocabulary, { ...DEFAULT_FILTER_CONFIGS['recent-failures'] }, database),
    'low-accuracy': countFilteredVocabulary(vocabulary, { ...config, type: 'low-accuracy', accuracyThreshold: config.accuracyThreshold ?? 70 }, database),
    'stale': countFilteredVocabulary(vocabulary, { ...config, type: 'stale', staleDays: config.staleDays ?? 3 }, database),
    'slow': countFilteredVocabulary(vocabulary, { ...DEFAULT_FILTER_CONFIGS['slow'] }, database),
    'new-additions': countFilteredVocabulary(vocabulary, { ...config, type: 'new-additions', newItemCount: config.newItemCount ?? 20 }, database),
  };

  const handleFilterChange = (type: VocabularyFilterType) => {
    const newConfig: VocabularyFilterConfig = {
      ...DEFAULT_FILTER_CONFIGS[type],
      // Preserve custom values if they exist
      accuracyThreshold: config.accuracyThreshold ?? DEFAULT_FILTER_CONFIGS[type].accuracyThreshold,
      staleDays: config.staleDays ?? DEFAULT_FILTER_CONFIGS[type].staleDays,
      speedThresholdMs: config.speedThresholdMs ?? DEFAULT_FILTER_CONFIGS[type].speedThresholdMs,
      newItemCount: config.newItemCount ?? DEFAULT_FILTER_CONFIGS[type].newItemCount,
      // Preserve mastery levels by prompt type
      masteryLevelsByPromptType: config.masteryLevelsByPromptType,
    };

    setSelectedFilter(type);
    setConfig(newConfig);
    onFilterChange(newConfig);

    if (rememberFilter) {
      saveFilterForExercise(exerciseKey, newConfig);
    }
  };

  const handleConfigChange = (updates: Partial<VocabularyFilterConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onFilterChange(newConfig);

    if (rememberFilter) {
      saveFilterForExercise(exerciseKey, newConfig);
    }
  };

  const handleRememberToggle = (remember: boolean) => {
    setRememberFilter(remember);
    if (remember) {
      saveFilterForExercise(exerciseKey, config);
    } else {
      clearFilterForExercise(exerciseKey);
    }
  };

  const handleMasteryToggle = (promptType: PromptType, level: MasteryLevel) => {
    const currentByPT = config.masteryLevelsByPromptType || buildDefaultMasteryByPT();
    const currentLevels = currentByPT[promptType] || [...DEFAULT_MASTERY_LEVELS];
    const newLevels = currentLevels.includes(level)
      ? currentLevels.filter(l => l !== level)
      : [...currentLevels, level];

    const newMasteryByPT: MasteryLevelsByPromptType = {
      ...currentByPT,
      [promptType]: newLevels
    };

    const newConfig = { ...config, masteryLevelsByPromptType: newMasteryByPT };
    setConfig(newConfig);
    onFilterChange(newConfig);

    if (rememberFilter) {
      saveFilterForExercise(exerciseKey, newConfig);
    }
  };

  // Check if mastery filter has any non-default selections
  const hasActiveMasteryFilter = config.masteryLevelsByPromptType &&
    Object.values(config.masteryLevelsByPromptType).some(levels => levels && levels.length < 4);

  const currentCount = countFilteredVocabulary(vocabulary, config, database);

  // Filter options grouped
  const filterOptions: { type: VocabularyFilterType; color: string }[] = [
    { type: 'all', color: 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600' },
    { type: 'selected-only', color: 'bg-violet-50 dark:bg-violet-900/30 border-violet-300 dark:border-violet-700' },
    { type: 'never-attempted', color: 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700' },
    { type: 'recent-failures', color: 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700' },
    { type: 'low-accuracy', color: 'bg-orange-50 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700' },
    { type: 'stale', color: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700' },
    { type: 'slow', color: 'bg-purple-50 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700' },
    { type: 'new-additions', color: 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700' },
  ];

  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-xl p-4">
      {/* Header with expand/collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🎯</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            Vocabulary Filter
          </span>
          {selectedFilter !== 'all' && (
            <span className="text-sm bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full">
              {FILTER_LABELS[selectedFilter]}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {currentCount} / {vocabulary.length} words
          </span>
          <span className="text-gray-400">
            {isExpanded ? '▲' : '▼'}
          </span>
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Filter type selection */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {filterOptions.map(({ type, color }) => {
              const isSelected = selectedFilter === type;
              const count = filterCounts[type];
              const isDisabled = count === 0 && type !== 'all';

              return (
                <button
                  key={type}
                  onClick={() => !isDisabled && handleFilterChange(type)}
                  disabled={isDisabled}
                  className={`
                    p-2 rounded-lg border-2 text-left transition-all
                    ${isSelected
                      ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-gray-800'
                      : ''
                    }
                    ${isDisabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:shadow-md cursor-pointer'
                    }
                    ${color}
                  `}
                  title={FILTER_DESCRIPTIONS[type]}
                >
                  <div className="text-xs font-medium text-gray-900 dark:text-white truncate">
                    {FILTER_LABELS[type]}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {count} items
                  </div>
                </button>
              );
            })}
          </div>

          {/* Filter-specific options */}
          {selectedFilter === 'low-accuracy' && (
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
              <label className="text-sm text-gray-700 dark:text-gray-300">
                Accuracy below:
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={config.accuracyThreshold ?? 70}
                onChange={(e) => handleConfigChange({ accuracyThreshold: parseInt(e.target.value) || 70 })}
                className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">%</span>
            </div>
          )}

          {selectedFilter === 'stale' && (
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
              <label className="text-sm text-gray-700 dark:text-gray-300">
                Not practiced in:
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={config.staleDays ?? 3}
                onChange={(e) => handleConfigChange({ staleDays: parseInt(e.target.value) || 3 })}
                className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">days</span>
            </div>
          )}

          {selectedFilter === 'new-additions' && (
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
              <label className="text-sm text-gray-700 dark:text-gray-300">
                Last
              </label>
              <input
                type="number"
                min="1"
                max={vocabulary.length}
                value={config.newItemCount ?? 20}
                onChange={(e) => handleConfigChange({ newItemCount: parseInt(e.target.value) || 20 })}
                className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">items in list</span>
            </div>
          )}

          {/* Mastery Level Filter - show for each prompt type this exercise uses */}
          {hasPromptTypes && (
            <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mastery Level
                </span>
                {hasActiveMasteryFilter && (
                  <span className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </div>
              <div className="space-y-3">
                {exercisePromptTypes.map(pt => {
                  const currentByPT = config.masteryLevelsByPromptType || {};
                  const currentLevels = currentByPT[pt] || DEFAULT_MASTERY_LEVELS;
                  const ptConfig = PROMPT_TYPE_CONFIG[pt];

                  return (
                    <div key={pt} className="bg-white dark:bg-gray-800 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="text-xs font-medium px-1.5 py-0.5 rounded"
                          style={{
                            color: ptConfig.color,
                            backgroundColor: `${ptConfig.color}20`
                          }}
                        >
                          {ptConfig.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(['mastered', 'learning', 'struggling', 'new'] as MasteryLevel[]).map(level => {
                          const isSelected = currentLevels.includes(level);
                          const color = MASTERY_COLORS[level];
                          return (
                            <button
                              key={level}
                              onClick={() => handleMasteryToggle(pt, level)}
                              className={`
                                px-3 py-1.5 text-sm rounded-lg border-2 transition-all
                                ${isSelected
                                  ? 'border-current shadow-sm'
                                  : 'border-gray-300 dark:border-gray-600 opacity-40'
                                }
                              `}
                              style={{
                                color: isSelected ? color : undefined,
                                backgroundColor: isSelected ? `${color}20` : undefined
                              }}
                            >
                              {level.charAt(0).toUpperCase() + level.slice(1)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Filter vocabulary by your mastery level for {exercisePromptTypes.length > 1 ? 'these skills' : 'this skill'}
              </p>
            </div>
          )}

          {/* Remember filter checkbox */}
          {showRememberOption && (
            <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
              <input
                type="checkbox"
                id={`remember-filter-${exerciseKey}`}
                checked={rememberFilter}
                onChange={(e) => handleRememberToggle(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor={`remember-filter-${exerciseKey}`}
                className="text-sm text-gray-600 dark:text-gray-400"
              >
                Remember this filter for {exerciseKey}
              </label>
            </div>
          )}

          {/* Filter description */}
          <p className="text-xs text-gray-500 dark:text-gray-400 italic">
            {FILTER_DESCRIPTIONS[selectedFilter]}
          </p>
        </div>
      )}
    </div>
  );
}
