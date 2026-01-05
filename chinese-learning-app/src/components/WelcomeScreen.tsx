import { VocabularyUploader } from './VocabularyUploader';

export function WelcomeScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              📖 Mandarin Pinyin Practice
            </h1>
            <p className="text-gray-600 text-lg">
              Character → Pinyin Reproduction Training
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">How it works:</h2>
            <ol className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <span className="font-bold text-blue-600">1.</span>
                <span>Upload your vocabulary file (mandarin_vocabulary_repertoire.md)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-bold text-blue-600">2.</span>
                <span>View Chinese characters and type their pinyin with tone numbers</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-bold text-blue-600">3.</span>
                <span>Get immediate feedback on accuracy and tone errors</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="font-bold text-blue-600">4.</span>
                <span>Track your progress with detailed session reports</span>
              </li>
            </ol>
          </div>

          {/* Features */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Features:</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <span className="text-2xl">✅</span>
                <div>
                  <div className="font-semibold text-gray-900">Instant Feedback</div>
                  <div className="text-sm text-gray-600">Immediate grading with error details</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <span className="text-2xl">🎯</span>
                <div>
                  <div className="font-semibold text-gray-900">Tone Focus</div>
                  <div className="text-sm text-gray-600">Track tone vs syllable errors</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <span className="text-2xl">💾</span>
                <div>
                  <div className="font-semibold text-gray-900">Data Persistence</div>
                  <div className="text-sm text-gray-600">Progress saved in browser</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <span className="text-2xl">📊</span>
                <div>
                  <div className="font-semibold text-gray-900">Session Reports</div>
                  <div className="text-sm text-gray-600">Detailed performance analysis</div>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Button */}
          <div className="mb-6">
            <VocabularyUploader />
          </div>

          {/* Format Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-600 text-center">
              <span className="font-semibold">Note:</span> Your vocabulary file should be a Markdown file
              with an "Active Vocabulary" section containing a table with columns: Word, Pinyin, Meaning
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
