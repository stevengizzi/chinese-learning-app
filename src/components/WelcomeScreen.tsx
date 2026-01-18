import { VocabularyUploader } from './VocabularyUploader';

export function WelcomeScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              📖 Mandarin Pinyin Practice
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Character → Pinyin Reproduction Training
            </p>
          </div>

          {/* Content Container */}
          <div className="max-w-2xl mx-auto">
            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">How it works:</h2>
            <ol className="space-y-3 text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-3">
                <span className="font-bold text-blue-600 dark:text-blue-400">1.</span>
                <span>Upload your vocabulary file (mandarin_vocabulary_repertoire.md)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-bold text-blue-600 dark:text-blue-400">2.</span>
                <span>View Chinese characters and type their pinyin with tone numbers</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-bold text-blue-600 dark:text-blue-400">3.</span>
                <span>Get immediate feedback on accuracy and tone errors</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-bold text-blue-600 dark:text-blue-400">4.</span>
                <span>Track your progress with detailed session reports</span>
              </li>
            </ol>
            </div>

            {/* Features */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Features:</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-2xl">✅</span>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">Instant Feedback</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Immediate grading with error details</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-2xl">🎯</span>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">Tone Focus</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Track tone vs syllable errors</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-2xl">💾</span>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">Data Persistence</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Progress saved in browser</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-2xl">📊</span>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">Session Reports</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Detailed performance analysis</div>
                </div>
              </div>
              </div>
            </div>

            {/* Upload Button */}
            <div className="flex justify-center mb-6">
              <VocabularyUploader />
            </div>

            {/* Format Info */}
            <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-4">
              <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
                <span className="font-semibold">Note:</span> Your vocabulary file should be a Markdown file
                with an "Active Vocabulary" section containing a table with columns: Word, Pinyin, Meaning
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
