import { useState } from 'react';
import type { TenseAspectConfig, TenseAspectItem, AspectType } from '../types/tenseAspect';
import {
  ALL_ASPECT_TYPES,
  AFFIRMATIVE_ASPECTS,
  NEGATIVE_ASPECTS,
  ASPECT_DISPLAY_NAMES,
  ASPECT_COLORS,
  DEFAULT_TENSE_ASPECT_CONFIG,
} from '../types/tenseAspect';
import { filterByAspectTypes, getCountsByAspectType } from '../lib/tenseAspectParser';

interface TenseAspectSetupProps {
  items: TenseAspectItem[];
  onStart: (config: TenseAspectConfig) => void;
  onBack: () => void;
}

export function TenseAspectSetup({ items, onStart, onBack }: TenseAspectSetupProps) {
  const [config, setConfig] = useState<TenseAspectConfig>(DEFAULT_TENSE_ASPECT_CONFIG);

  const counts = getCountsByAspectType(items);
  const filteredCount = filterByAspectTypes(items, config.selectedAspects).length;

  const toggleAspect = (aspect: AspectType) => {
    setConfig(prev => {
      const isSelected = prev.selectedAspects.includes(aspect);
      if (isSelected) {
        return {
          ...prev,
          selectedAspects: prev.selectedAspects.filter(a => a !== aspect),
        };
      } else {
        return {
          ...prev,
          selectedAspects: [...prev.selectedAspects, aspect],
        };
      }
    });
  };

  const selectAll = () => {
    setConfig(prev => ({ ...prev, selectedAspects: [...ALL_ASPECT_TYPES] }));
  };

  const selectNone = () => {
    setConfig(prev => ({ ...prev, selectedAspects: [] }));
  };

  const selectAffirmative = () => {
    setConfig(prev => ({ ...prev, selectedAspects: [...AFFIRMATIVE_ASPECTS] }));
  };

  const selectNegative = () => {
    setConfig(prev => ({ ...prev, selectedAspects: [...NEGATIVE_ASPECTS] }));
  };

  const handleStart = () => {
    if (filteredCount > 0) {
      onStart(config);
    }
  };

  const renderAspectButton = (aspect: AspectType) => {
    const isSelected = config.selectedAspects.includes(aspect);
    const count = counts[aspect] || 0;
    const colors = ASPECT_COLORS[aspect];

    return (
      <button
        key={aspect}
        onClick={() => toggleAspect(aspect)}
        className={`
          p-3 rounded-lg border-2 text-left transition-all
          ${isSelected
            ? `${colors.bg} ${colors.border} ring-2 ring-offset-1 ring-emerald-500 dark:ring-offset-gray-800`
            : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 opacity-50'
          }
        `}
      >
        <div className={`text-sm font-medium ${isSelected ? colors.text : 'text-gray-600 dark:text-gray-400'}`}>
          {ASPECT_DISPLAY_NAMES[aspect]}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {count} items
        </div>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Tense & Aspect Practice
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Master Chinese time/aspect markers: 了, 过, 正在, 会, 没, 不
            </p>
          </div>

          {/* Aspect Selection */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Select Aspects to Practice
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-300"
                >
                  All
                </button>
                <button
                  onClick={selectNone}
                  className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-300"
                >
                  None
                </button>
              </div>
            </div>

            {/* Affirmative Aspects */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Affirmative
                </h3>
                <button
                  onClick={selectAffirmative}
                  className="text-xs px-2 py-0.5 text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Select Only
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {AFFIRMATIVE_ASPECTS.map(renderAspectButton)}
              </div>
            </div>

            {/* Negative Aspects */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Negative
                </h3>
                <button
                  onClick={selectNegative}
                  className="text-xs px-2 py-0.5 text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Select Only
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {NEGATIVE_ASPECTS.map(renderAspectButton)}
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Options
            </h2>

            {/* Mode */}
            <div className="flex items-center gap-4 mb-3">
              <span className="text-sm text-gray-700 dark:text-gray-300">Mode:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfig(prev => ({ ...prev, mode: 'standard' }))}
                  className={`px-3 py-1.5 text-sm rounded-lg border-2 transition-all ${
                    config.mode === 'standard'
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-500 text-emerald-800 dark:text-emerald-200'
                      : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  Standard
                </button>
                <button
                  onClick={() => setConfig(prev => ({ ...prev, mode: 'speed' }))}
                  className={`px-3 py-1.5 text-sm rounded-lg border-2 transition-all ${
                    config.mode === 'speed'
                      ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-500 text-amber-800 dark:text-amber-200'
                      : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  Speed Drill
                </button>
              </div>
            </div>

            {/* Shuffle */}
            <div className="flex items-center gap-3 mb-3">
              <input
                type="checkbox"
                id="shuffle"
                checked={config.shuffle}
                onChange={(e) => setConfig(prev => ({ ...prev, shuffle: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="shuffle" className="text-sm text-gray-700 dark:text-gray-300">
                Shuffle order
              </label>
            </div>

            {/* Hints */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="hints"
                checked={config.showHints}
                onChange={(e) => setConfig(prev => ({ ...prev, showHints: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="hints" className="text-sm text-gray-700 dark:text-gray-300">
                Show aspect type hints
              </label>
            </div>
          </div>

          {/* Item Count */}
          <div className="mb-6 text-center">
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {filteredCount}
            </span>
            <span className="text-gray-600 dark:text-gray-400 ml-2">
              items to practice
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onBack}
              className="flex-1 py-3 px-6 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold rounded-xl transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleStart}
              disabled={filteredCount === 0}
              className={`flex-1 py-3 px-6 font-semibold rounded-xl transition-all ${
                filteredCount > 0
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md hover:shadow-lg'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
            >
              Start Practice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
