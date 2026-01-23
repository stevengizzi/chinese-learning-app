import { useState } from 'react';
import { useExercise } from '../../contexts/ExerciseContext';
import { DashboardContent } from './DashboardContent';
import { VocabularyContent } from './VocabularyContent';
import { VocabularyUploader } from '../VocabularyUploader';

type TabType = 'dashboard' | 'vocabulary';

export function DashboardTabs() {
  const { dispatch } = useExercise();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const handleBack = () => {
    dispatch({ type: 'BACK_TO_MENU' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleBack}
            className="bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-lg shadow-md transition-colors flex items-center gap-2"
          >
            <span>←</span>
            Back
          </button>

          {/* Update Vocabulary button - only show on vocabulary tab */}
          {activeTab === 'vocabulary' && (
            <VocabularyUploader />
          )}
        </div>

        {/* Tab Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg mb-6 p-1 inline-flex">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`
              px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2
              ${activeTab === 'dashboard'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }
            `}
          >
            <span className="text-xl">📊</span>
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('vocabulary')}
            className={`
              px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2
              ${activeTab === 'vocabulary'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }
            `}
          >
            <span className="text-xl">📋</span>
            Vocabulary
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' ? (
          <DashboardContent />
        ) : (
          <VocabularyContent />
        )}
      </div>
    </div>
  );
}
