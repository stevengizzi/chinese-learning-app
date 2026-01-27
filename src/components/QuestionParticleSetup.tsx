import { useState } from 'react';
import type { InterrogativeConfig, InterrogativeItem, InterrogativeParticle } from '../types/interrogativeParticle';
import {
  ALL_INTERROGATIVE_PARTICLES,
  INTERROGATIVE_INFO,
  DEFAULT_INTERROGATIVE_CONFIG,
} from '../types/interrogativeParticle';
import { filterByParticles, getCountsByParticle } from '../lib/questionParticleParser';

interface QuestionParticleSetupProps {
  items: InterrogativeItem[];
  onStart: (config: InterrogativeConfig) => void;
  onBack: () => void;
}

export function QuestionParticleSetup({ items, onStart, onBack }: QuestionParticleSetupProps) {
  const [config, setConfig] = useState<InterrogativeConfig>(DEFAULT_INTERROGATIVE_CONFIG);

  const counts = getCountsByParticle(items);
  const filteredCount = filterByParticles(items, config.selectedParticles).length;

  const toggleParticle = (particle: InterrogativeParticle) => {
    setConfig(prev => {
      const isSelected = prev.selectedParticles.includes(particle);
      if (isSelected) {
        return {
          ...prev,
          selectedParticles: prev.selectedParticles.filter(p => p !== particle),
        };
      } else {
        return {
          ...prev,
          selectedParticles: [...prev.selectedParticles, particle],
        };
      }
    });
  };

  const selectAll = () => {
    setConfig(prev => ({ ...prev, selectedParticles: [...ALL_INTERROGATIVE_PARTICLES] }));
  };

  const selectNone = () => {
    setConfig(prev => ({ ...prev, selectedParticles: [] }));
  };

  const handleStart = () => {
    if (filteredCount > 0) {
      onStart(config);
    }
  };

  const renderParticleButton = (particle: InterrogativeParticle) => {
    const isSelected = config.selectedParticles.includes(particle);
    const count = counts[particle] || 0;
    const info = INTERROGATIVE_INFO[particle];

    return (
      <button
        key={particle}
        onClick={() => toggleParticle(particle)}
        className={`
          p-4 rounded-xl border-2 text-left transition-all
          ${isSelected
            ? `${info.color.bg} ${info.color.border} ring-2 ring-offset-1 ring-blue-500 dark:ring-offset-gray-800`
            : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 opacity-50'
          }
        `}
      >
        <div className="flex items-center justify-between mb-2">
          <span className={`text-3xl font-bold ${isSelected ? info.color.text : 'text-gray-600 dark:text-gray-400'}`}>
            {particle}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {count} items
          </span>
        </div>
        <div className={`text-sm font-medium ${isSelected ? info.color.text : 'text-gray-600 dark:text-gray-400'}`}>
          {info.name} ({info.pinyin})
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {info.usage}
        </div>
        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          e.g., {info.examples[0]}
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
              Question Particles
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Master turning statements into questions: 吗, 呢, 吧
            </p>
          </div>

          {/* Particle Selection */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Select Particles to Practice
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {ALL_INTERROGATIVE_PARTICLES.map(renderParticleButton)}
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
                Show particle type hints
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
