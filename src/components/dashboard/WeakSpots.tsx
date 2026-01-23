import { useState } from 'react';
import type { VocabularyMasteryInfo } from '../../types/dashboard';
import { WeakSpotsModal } from './WeakSpotsModal';

interface WeakSpotsProps {
  items: VocabularyMasteryInfo[];
  maxItems?: number;
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

export function WeakSpots({ items, maxItems = 8 }: WeakSpotsProps) {
  const [showModal, setShowModal] = useState(false);
  const displayItems = items.slice(0, maxItems);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <span>⚠️</span>
        Needs Attention
      </h2>

      {displayItems.length === 0 ? (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
          <p className="text-2xl mb-2">🎉</p>
          <p>No weak spots found!</p>
          <p className="text-sm mt-1">Keep up the great work!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayItems.map((item) => (
            <div
              key={item.vocabularyId}
              className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-lg p-3 flex items-center justify-between transition-all hover:bg-amber-100 dark:hover:bg-amber-900/30"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl font-medium">{item.character}</span>
                <div className="text-sm">
                  <div className="text-gray-700 dark:text-gray-300">{item.pinyin}</div>
                  <div className="text-gray-500 dark:text-gray-400 text-xs truncate max-w-[100px]">
                    {item.meaning}
                  </div>
                </div>
              </div>

              <div className="text-right text-sm">
                <div className={`font-semibold ${getAccuracyColor(item.accuracy)}`}>
                  {Math.round(item.accuracy)}%
                </div>
                <div className="text-gray-500 dark:text-gray-400 text-xs">
                  {item.totalAttempts} attempts
                </div>
              </div>
            </div>
          ))}

          {items.length > maxItems && (
            <div className="text-center pt-2">
              <button
                onClick={() => setShowModal(true)}
                className="text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:underline cursor-pointer transition-colors"
              >
                +{items.length - maxItems} more items need attention
              </button>
            </div>
          )}
        </div>
      )}

      {displayItems.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            These items have accuracy below 80%. Practice them to improve!
          </p>
        </div>
      )}

      {/* Full list modal */}
      {showModal && (
        <WeakSpotsModal
          items={items}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
