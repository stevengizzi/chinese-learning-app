import { useState } from 'react';
import type { InterrogativeConfig, InterrogativeItem, QuestionType } from '../types/interrogative';
import {
  ALL_QUESTION_TYPES,
  BASIC_QUESTION_TYPES,
  WHEN_QUESTION_TYPES,
  HOW_QUESTION_TYPES,
  WHY_QUESTION_TYPES,
  QUESTION_DISPLAY_NAMES,
  QUESTION_COLORS,
  DEFAULT_INTERROGATIVE_CONFIG,
} from '../types/interrogative';
import { filterByQuestionTypes, getCountsByQuestionType } from '../lib/interrogativeParser';
import { CharacterSetToggle } from './CharacterSetToggle';
import { loadCharacterSetPreference, saveCharacterSetPreference } from '../lib/characterConverter';
import type { CharacterSet } from '../lib/characterConverter';

interface InterrogativeSetupProps {
  items: InterrogativeItem[];
  onStart: (config: InterrogativeConfig) => void;
  onBack: () => void;
}

export function InterrogativeSetup({ items, onStart, onBack }: InterrogativeSetupProps) {
  const [config, setConfig] = useState<InterrogativeConfig>(DEFAULT_INTERROGATIVE_CONFIG);
  const [characterSet, setCharacterSet] = useState<CharacterSet>(loadCharacterSetPreference);
  const handleCharacterSetChange = (value: CharacterSet) => {
    setCharacterSet(value);
    saveCharacterSetPreference(value);
  };

  const counts = getCountsByQuestionType(items);
  const filteredCount = filterByQuestionTypes(items, config.selectedTypes).length;

  const toggleType = (type: QuestionType) => {
    setConfig(prev => {
      const isSelected = prev.selectedTypes.includes(type);
      if (isSelected) {
        return {
          ...prev,
          selectedTypes: prev.selectedTypes.filter(t => t !== type),
        };
      } else {
        return {
          ...prev,
          selectedTypes: [...prev.selectedTypes, type],
        };
      }
    });
  };

  const selectAll = () => {
    setConfig(prev => ({ ...prev, selectedTypes: [...ALL_QUESTION_TYPES] }));
  };

  const selectNone = () => {
    setConfig(prev => ({ ...prev, selectedTypes: [] }));
  };

  const selectBasic = () => {
    setConfig(prev => ({ ...prev, selectedTypes: [...BASIC_QUESTION_TYPES] }));
  };

  const selectWhen = () => {
    setConfig(prev => ({ ...prev, selectedTypes: [...WHEN_QUESTION_TYPES] }));
  };

  const selectHow = () => {
    setConfig(prev => ({ ...prev, selectedTypes: [...HOW_QUESTION_TYPES] }));
  };

  const handleStart = () => {
    if (filteredCount > 0) {
      onStart(config);
    }
  };

  const renderTypeButton = (type: QuestionType) => {
    const isSelected = config.selectedTypes.includes(type);
    const count = counts[type] || 0;
    const colors = QUESTION_COLORS[type];

    return (
      <button
        key={type}
        onClick={() => toggleType(type)}
        className={`
          p-3 rounded-lg border-2 text-left transition-all
          ${isSelected
            ? `${colors.bg} ${colors.border} ring-2 ring-offset-1 ring-blue-500 dark:ring-offset-gray-800`
            : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 opacity-50'
          }
        `}
      >
        <div className={`text-sm font-medium ${isSelected ? colors.text : 'text-gray-600 dark:text-gray-400'}`}>
          {QUESTION_DISPLAY_NAMES[type]}
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
              Question Words Practice
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Master Chinese interrogatives: 什么, 谁, 哪儿, 什么时候, 为什么, 怎么...
            </p>
          </div>

          {/* Type Selection */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Select Question Types
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

            {/* Basic Question Words */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Basic (What, Who, Where, Which)
                </h3>
                <button
                  onClick={selectBasic}
                  className="text-xs px-2 py-0.5 text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Select Only
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {BASIC_QUESTION_TYPES.map(renderTypeButton)}
              </div>
            </div>

            {/* When Questions */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  When (Time, Day, Date)
                </h3>
                <button
                  onClick={selectWhen}
                  className="text-xs px-2 py-0.5 text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Select Only
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {WHEN_QUESTION_TYPES.map(renderTypeButton)}
              </div>
            </div>

            {/* Why */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Why
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {WHY_QUESTION_TYPES.map(renderTypeButton)}
              </div>
            </div>

            {/* How Questions */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  How (Method, Quality, Amount)
                </h3>
                <button
                  onClick={selectHow}
                  className="text-xs px-2 py-0.5 text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Select Only
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {HOW_QUESTION_TYPES.map(renderTypeButton)}
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
                      ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 text-blue-800 dark:text-blue-200'
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
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="hints" className="text-sm text-gray-700 dark:text-gray-300">
                Show question type hints
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

          {/* Character Set */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 flex justify-center">
            <CharacterSetToggle value={characterSet} onChange={handleCharacterSetChange} />
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
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg'
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
