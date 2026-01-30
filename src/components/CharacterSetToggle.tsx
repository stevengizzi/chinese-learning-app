/**
 * Character Set Toggle Component
 *
 * A segmented control for switching between simplified and traditional Chinese characters.
 * Used in exercise setup screens.
 */

import type { CharacterSet } from '../lib/characterConverter';

interface CharacterSetToggleProps {
  value: CharacterSet;
  onChange: (value: CharacterSet) => void;
}

export function CharacterSetToggle({ value, onChange }: CharacterSetToggleProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Characters:</span>
      <div className="inline-flex rounded-lg border-2 border-gray-300 dark:border-gray-600 overflow-hidden">
        <button
          onClick={() => onChange('simplified')}
          className={`px-3 py-1.5 text-sm font-medium transition-colors ${
            value === 'simplified'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
          }`}
        >
          简体
        </button>
        <button
          onClick={() => onChange('traditional')}
          className={`px-3 py-1.5 text-sm font-medium transition-colors ${
            value === 'traditional'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
          }`}
        >
          繁體
        </button>
      </div>
    </div>
  );
}
