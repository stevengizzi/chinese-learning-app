import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { useExercise } from '../contexts/ExerciseContext';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

export function ExerciseScreen() {
  const { state, dispatch } = useExercise();
  const [answer, setAnswer] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input when screen loads
    inputRef.current?.focus();
  }, [state.currentExercise]);

  useKeyboardShortcuts({
    onEscape: () => dispatch({ type: 'REQUEST_REPORT' })
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (answer.trim()) {
      dispatch({ type: 'SUBMIT_ANSWER', payload: answer });
      setAnswer('');
    }
  };

  const handleRequestReport = () => {
    dispatch({ type: 'REQUEST_REPORT' });
  };

  const handleBackToMenu = () => {
    dispatch({ type: 'BACK_TO_MENU' });
  };

  const exerciseNumber = state.currentSession?.attempts.length || 0;
  const remainingWords = state.currentSession?.remainingWords?.length || 0;
  const isCompleteAllMode = state.currentSession?.playMode === 'complete-all';
  const isDrillMode = state.currentSession?.playMode === 'drill';
  const showRemainingCount = isCompleteAllMode || isDrillMode;

  // Helper function to check if prompt contains Chinese characters
  const isChinesePrompt = (prompt: string | undefined): boolean => {
    if (!prompt) return false;
    // Check if prompt contains any Chinese characters (Unicode range for CJK)
    return /[\u4e00-\u9fff]/.test(prompt);
  };

  const prompt = state.currentExercise?.prompt;
  const useLargeFont = isChinesePrompt(prompt);
  const isEnglishExercise = state.currentSession?.exerciseType?.endsWith('-english');
  const instructionText = isEnglishExercise
    ? '👉 Type the English meaning:'
    : '👉 Type the tone-number pinyin:';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
          {/* Header - aligned to prompt field width */}
          <div className="mb-8 flex justify-center">
            <div className="w-1/2 flex justify-between items-center">
              <h2 className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                Exercise {exerciseNumber + 1}
                {showRemainingCount && ` • ${remainingWords} remaining`}
              </h2>
              <button
                onClick={handleBackToMenu}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm font-medium"
              >
                ← Back to Menu
              </button>
            </div>
          </div>

          {/* Prompt Display */}
          <div className="mb-8 flex justify-center">
            <div className="w-1/2 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl p-12 text-center">
              <div className={`${useLargeFont ? 'text-[80px] md:text-[120px]' : 'text-[40px] md:text-[60px]'} leading-tight font-normal text-gray-900 dark:text-white break-words`}>
                {state.currentExercise?.prompt}
              </div>
            </div>
          </div>

          {/* Instruction */}
          <div className="mb-6 flex justify-center">
            <p className="text-gray-700 dark:text-gray-300 text-lg text-center">
              {instructionText}
            </p>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit}>
            <div className="flex justify-center">
              <input
                ref={inputRef}
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="w-1/4 px-6 py-4 text-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all font-mono"
                placeholder="e.g., wo3 ming2 bai2"
                autoComplete="off"
                spellCheck="false"
                autoCorrect="off"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center mt-6">
              <div className="flex flex-col sm:flex-row gap-4 w-1/4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold py-4 px-8 rounded-xl transition-colors duration-200 text-lg disabled:opacity-50 disabled:cursor-not-allowed my-1"
                  disabled={!answer.trim()}
                >
                  Submit Answer
                </button>
                <button
                  type="button"
                  onClick={handleRequestReport}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold py-4 px-8 rounded-xl transition-colors duration-200 text-lg my-1"
                >
                  View Report
                </button>
              </div>
            </div>
          </form>

          {/* Exercise Type Info */}
          {state.currentSession && (
            <div className="mt-8 pt-6">
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                Mode: {
                  state.currentSession.exerciseType === 'character-to-pinyin' ? 'Character → Pinyin' :
                  state.currentSession.exerciseType === 'english-to-pinyin' ? 'English → Pinyin' :
                  state.currentSession.exerciseType === 'shuffled' ? 'Shuffled (Characters & English) → Pinyin' :
                  state.currentSession.exerciseType === 'character-to-english' ? 'Character → English' :
                  state.currentSession.exerciseType === 'pinyin-to-english' ? 'Pinyin → English' :
                  'Shuffled (Characters & Pinyin) → English'
                }
                {' • '}
                {state.currentSession.playMode === 'endless' ? 'Endless Practice' : state.currentSession.playMode === 'complete-all' ? 'Complete All' : 'Drill Mode'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
