import type { VocabularyMasteryInfo } from '../../types/dashboard';

interface WeakSpotsModalProps {
  items: VocabularyMasteryInfo[];
  onClose: () => void;
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
 * Format last practiced time
 */
function formatLastPracticed(timestamp: number | null): string {
  if (!timestamp) return 'Never';

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

  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function WeakSpotsModal({ items, onClose }: WeakSpotsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>⚠️</span>
              Items Needing Attention
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                ({items.length} items)
              </span>
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Vocabulary with accuracy below 80%. Practice these to improve!
          </p>
        </div>

        {/* Table Header */}
        <div className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            <div className="col-span-2">Character</div>
            <div className="col-span-2">Pinyin</div>
            <div className="col-span-3">Meaning</div>
            <div className="col-span-2 text-right">Accuracy</div>
            <div className="col-span-1 text-right">Tries</div>
            <div className="col-span-2 text-right">Last</div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {items.map((item) => (
            <div
              key={item.vocabularyId}
              className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-700/50 hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-colors items-center"
            >
              <div className="col-span-2 text-xl font-medium text-gray-900 dark:text-white">
                {item.character}
              </div>
              <div className="col-span-2 text-sm text-gray-700 dark:text-gray-300">
                {item.pinyin}
              </div>
              <div className="col-span-3 text-sm text-gray-600 dark:text-gray-400 truncate" title={item.meaning}>
                {item.meaning}
              </div>
              <div className={`col-span-2 text-right text-sm font-semibold ${getAccuracyColor(item.accuracy)}`}>
                {Math.round(item.accuracy)}%
              </div>
              <div className="col-span-1 text-right text-sm text-gray-500 dark:text-gray-400">
                {item.totalAttempts}
              </div>
              <div className="col-span-2 text-right text-xs text-gray-500 dark:text-gray-400">
                {formatLastPracticed(item.lastPracticed)}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
