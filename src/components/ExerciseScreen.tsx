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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* Header - aligned to prompt field width */}
          <div className="mb-8 flex justify-center">
            <div className="w-1/2 flex justify-between items-center">
              <h2 className="text-gray-500 text-sm font-medium">
                Exercise {exerciseNumber + 1}
                {showRemainingCount && ` • ${remainingWords} remaining`}
              </h2>
              <button
                onClick={handleBackToMenu}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                ← Back to Menu
              </button>
            </div>
          </div>

          {/* Prompt Display */}
          <div className="mb-8 flex justify-center">
            <div className="w-1/2 bg-gray-50 border-2 border-gray-200 rounded-xl p-12 text-center">
              <div className={`${state.currentSession?.exerciseType === 'meaning-to-pinyin' ? 'text-[40px] md:text-[60px]' : 'text-[80px] md:text-[120px]'} leading-tight font-normal text-gray-900 break-words`}>
                {state.currentExercise?.prompt}
              </div>
            </div>
          </div>

          {/* Instruction */}
          <div className="mb-6 flex justify-center">
            <p className="text-gray-700 text-lg text-center">
              👉 Type the tone-number pinyin:
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
                className="w-1/4 px-6 py-4 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-mono"
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
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-xl transition-colors duration-200 text-lg disabled:opacity-50 disabled:cursor-not-allowed my-1"
                  disabled={!answer.trim()}
                >
                  Submit Answer
                </button>
                <button
                  type="button"
                  onClick={handleRequestReport}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-4 px-8 rounded-xl transition-colors duration-200 text-lg my-1"
                >
                  View Report
                </button>
              </div>
            </div>
          </form>

          {/* Exercise Type Info */}
          {state.currentSession && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-center text-sm text-gray-500">
                Mode: {state.currentSession.exerciseType === 'character-to-pinyin' ? 'Character → Pinyin' : 'English → Pinyin'}
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
