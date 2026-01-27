import { useState } from 'react';
import { VocabularyUploader } from './VocabularyUploader';
import { useExercise } from '../contexts/ExerciseContext';
import { getHskVocabulary, HSK_LEVELS } from '../lib/hskVocabulary';

type ImportMode = 'choice' | 'pleco' | 'markdown' | 'hsk';

export function WelcomeScreen() {
  const { dispatch } = useExercise();
  const [mode, setMode] = useState<ImportMode>('choice');
  const [selectedHskLevel, setSelectedHskLevel] = useState<number>(1);

  const handleHskSelect = () => {
    const vocabularyData = getHskVocabulary(selectedHskLevel);
    dispatch({ type: 'SET_VOCABULARY', payload: vocabularyData });
  };

  const renderChoiceScreen = () => (
    <>
      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">How it works:</h2>
        <ol className="space-y-3 text-gray-700 dark:text-gray-300">
          <li className="flex items-start gap-3">
            <span className="font-bold text-blue-600 dark:text-blue-400">1.</span>
            <span>Import your vocabulary from Pleco, a Markdown file, or use built-in HSK lists</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="font-bold text-blue-600 dark:text-blue-400">2.</span>
            <span>Practice with multiple exercise types: pinyin recall, tones, grammar, and more</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="font-bold text-blue-600 dark:text-blue-400">3.</span>
            <span>Get immediate feedback and track your progress over time</span>
          </li>
        </ol>
      </div>

      {/* Import Options */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 text-center">
          Get started with your vocabulary:
        </h2>
        <div className="space-y-4">
          {/* Pleco Import */}
          <button
            onClick={() => setMode('pleco')}
            className="w-full p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-left group"
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">📱</span>
              <div className="flex-1">
                <div className="font-semibold text-green-900 dark:text-green-100 text-lg">
                  Import from Pleco
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">
                  Upload XML export from Pleco flashcard app
                </div>
              </div>
              <span className="text-green-600 dark:text-green-400 opacity-0 group-hover:opacity-100 transition-opacity">
                →
              </span>
            </div>
          </button>

          {/* Markdown Import */}
          <button
            onClick={() => setMode('markdown')}
            className="w-full p-4 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-700 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-left group"
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">📝</span>
              <div className="flex-1">
                <div className="font-semibold text-purple-900 dark:text-purple-100 text-lg">
                  Import Markdown File
                </div>
                <div className="text-sm text-purple-700 dark:text-purple-300">
                  Upload a custom vocabulary list in Markdown format
                </div>
              </div>
              <span className="text-purple-600 dark:text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
                →
              </span>
            </div>
          </button>

          {/* HSK Built-in */}
          <button
            onClick={() => setMode('hsk')}
            className="w-full p-4 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-700 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors text-left group"
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">📚</span>
              <div className="flex-1">
                <div className="font-semibold text-amber-900 dark:text-amber-100 text-lg">
                  Use Built-in HSK Vocabulary
                </div>
                <div className="text-sm text-amber-700 dark:text-amber-300">
                  Start immediately with standard HSK word lists
                </div>
              </div>
              <span className="text-amber-600 dark:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">
                →
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
          <span className="text-xl mb-1">✅</span>
          <div className="text-xs font-medium text-gray-900 dark:text-white">Instant Feedback</div>
        </div>
        <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
          <span className="text-xl mb-1">🎯</span>
          <div className="text-xs font-medium text-gray-900 dark:text-white">Tone Training</div>
        </div>
        <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
          <span className="text-xl mb-1">💾</span>
          <div className="text-xs font-medium text-gray-900 dark:text-white">Progress Saved</div>
        </div>
        <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
          <span className="text-xl mb-1">📊</span>
          <div className="text-xs font-medium text-gray-900 dark:text-white">Session Reports</div>
        </div>
      </div>
    </>
  );

  const renderPlecoScreen = () => (
    <>
      <button
        onClick={() => setMode('choice')}
        className="mb-6 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm font-medium"
      >
        ← Back to options
      </button>

      <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700 rounded-xl p-6 mb-6">
        <h2 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-4 flex items-center gap-2">
          <span>📱</span> Import from Pleco
        </h2>
        <ol className="space-y-3 text-green-800 dark:text-green-200 text-sm">
          <li className="flex items-start gap-2">
            <span className="font-bold">1.</span>
            <span>Open Pleco and go to your flashcard list</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">2.</span>
            <span>Tap the menu (⋮) → Export → XML format</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">3.</span>
            <span>Save or share the XML file to your computer</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold">4.</span>
            <span>Click the button below to upload</span>
          </li>
        </ol>
      </div>

      <div className="flex justify-center mb-6">
        <VocabularyUploader
          buttonText="📱 Upload Pleco XML"
          buttonClassName="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-xl transition-colors duration-200"
        />
      </div>

      <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-4">
        <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
          <span className="font-semibold">Tip:</span> After importing, you can edit definitions
          in the Vocabulary view if they're too long or need adjustment.
        </p>
      </div>
    </>
  );

  const renderMarkdownScreen = () => (
    <>
      <button
        onClick={() => setMode('choice')}
        className="mb-6 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm font-medium"
      >
        ← Back to options
      </button>

      <div className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-700 rounded-xl p-6 mb-6">
        <h2 className="text-xl font-semibold text-purple-900 dark:text-purple-100 mb-4 flex items-center gap-2">
          <span>📝</span> Import Markdown File
        </h2>
        <p className="text-purple-800 dark:text-purple-200 text-sm mb-4">
          Your Markdown file should have an "Active Vocabulary" section with a table:
        </p>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 font-mono text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">
          <pre>{`## Active Vocabulary

| Word | Pinyin | Meaning |
| ---- | ------ | ------- |
| 你好 | ni3 hao3 | hello |
| 谢谢 | xie4 xie5 | thank you |`}</pre>
        </div>
      </div>

      <div className="flex justify-center mb-6">
        <VocabularyUploader
          buttonText="📝 Upload Markdown File"
          buttonClassName="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-xl transition-colors duration-200"
        />
      </div>
    </>
  );

  const renderHskScreen = () => (
    <>
      <button
        onClick={() => setMode('choice')}
        className="mb-6 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm font-medium"
      >
        ← Back to options
      </button>

      <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-700 rounded-xl p-6 mb-6">
        <h2 className="text-xl font-semibold text-amber-900 dark:text-amber-100 mb-4 flex items-center gap-2">
          <span>📚</span> Built-in HSK Vocabulary
        </h2>
        <p className="text-amber-800 dark:text-amber-200 text-sm mb-4">
          Start practicing immediately with official HSK vocabulary lists.
          Select a level to begin:
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          {HSK_LEVELS.map((level) => (
            <button
              key={level.level}
              onClick={() => setSelectedHskLevel(level.level)}
              className={`p-3 rounded-lg border-2 transition-all ${
                selectedHskLevel === level.level
                  ? 'border-amber-500 bg-amber-100 dark:bg-amber-900/40'
                  : 'border-gray-200 dark:border-gray-600 hover:border-amber-300 dark:hover:border-amber-600'
              }`}
            >
              <div className="font-bold text-gray-900 dark:text-white">HSK {level.level}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">{level.wordCount} words</div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-center mb-6">
        <button
          onClick={handleHskSelect}
          className="bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 px-8 rounded-xl transition-colors duration-200"
        >
          Start with HSK {selectedHskLevel}
        </button>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-4">
        <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
          <span className="font-semibold">Note:</span> You can import your own vocabulary later
          from the main menu.
        </p>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Mandarin Practice
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Master Chinese characters, pinyin, tones, and grammar
            </p>
          </div>

          {/* Content based on mode */}
          <div className="max-w-xl mx-auto">
            {mode === 'choice' && renderChoiceScreen()}
            {mode === 'pleco' && renderPlecoScreen()}
            {mode === 'markdown' && renderMarkdownScreen()}
            {mode === 'hsk' && renderHskScreen()}
          </div>
        </div>
      </div>
    </div>
  );
}
