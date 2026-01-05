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

  const exerciseNumber = state.currentSession?.attempts.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-gray-500 text-sm font-medium">
              Exercise {exerciseNumber + 1}
            </h2>
          </div>

          {/* Character Display */}
          <div className="mb-8">
            <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-12 text-center">
              <div className="text-6xl md:text-7xl font-normal text-gray-900">
                {state.currentExercise?.sentence}
              </div>
            </div>
          </div>

          {/* Instruction */}
          <div className="mb-6">
            <p className="text-gray-700 text-lg">
              👉 Type the tone-number pinyin:
            </p>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-mono"
              placeholder="e.g., wo3 ming2 bai2"
              autoComplete="off"
              spellCheck="false"
              autoCorrect="off"
            />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-xl transition-colors duration-200 text-lg"
                disabled={!answer.trim()}
              >
                Submit Answer
              </button>
              <button
                type="button"
                onClick={handleRequestReport}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-4 px-8 rounded-xl transition-colors duration-200 text-lg"
              >
                View Report
              </button>
            </div>
          </form>

          {/* Vocabulary Info */}
          {state.vocabulary && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-center text-sm text-gray-500">
                Active vocabulary: {state.vocabulary.active.length} words
                {state.vocabulary.metadata.lastUpdated && (
                  <span className="ml-2">
                    • Updated: {state.vocabulary.metadata.lastUpdated}
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
