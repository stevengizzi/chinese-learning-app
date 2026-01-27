import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { useExercise } from '../contexts/ExerciseContext';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { isAudioExercise } from '../types/exercise';
import { AudioPrompt } from './AudioPrompt';

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
  const isSpeedDrillMode = state.currentSession?.playMode === 'speed-drill';
  const showRemainingCount = isCompleteAllMode || isDrillMode || isSpeedDrillMode;

  // Helper function to check if prompt is primarily Chinese characters
  // (not just containing Chinese, but being primarily Chinese)
  const isChinesePrompt = (prompt: string | undefined): boolean => {
    if (!prompt) return false;
    // If prompt contains parentheses with Chinese inside (e.g., "líng (零)"), it's pinyin disambiguation
    // In this case, don't use large font
    if (/\([^\)]*[\u4e00-\u9fff][^\)]*\)/.test(prompt)) {
      return false;
    }
    // Check if prompt contains Chinese characters (Unicode range for CJK)
    return /[\u4e00-\u9fff]/.test(prompt);
  };

  // Check if prompt has Chinese characters followed by parentheses (disambiguation text)
  // Only shrink parenthetical text when Chinese characters come before it
  const hasChineseThenParentheses = (prompt: string | undefined): boolean => {
    if (!prompt) return false;
    // Match: Chinese character(s) followed by optional space and parentheses
    return /[\u4e00-\u9fff]\s*\([^\)]+\)/.test(prompt);
  };

  // Format prompt with smaller parenthetical text (only when Chinese precedes it)
  const formatPromptWithParentheses = (prompt: string): React.ReactNode => {
    // Match pattern: text with Chinese before parens, parens with content, text after
    const match = prompt.match(/^(.+?)([\u4e00-\u9fff])(\s*\([^\)]+\))(.*)$/);
    if (!match) return prompt;

    const [, beforeChinese, lastChinese, parens, after] = match;
    return (
      <>
        {beforeChinese}{lastChinese}
        <span className="text-[0.6em] text-gray-500 dark:text-gray-400">{parens}</span>
        {after}
      </>
    );
  };

  const prompt = state.currentExercise?.prompt;
  const useLargeFont = isChinesePrompt(prompt);
  const promptHasChineseThenParentheses = hasChineseThenParentheses(prompt);

  // Count Chinese characters in a string (excluding parenthetical disambiguation)
  const countChineseChars = (text: string): number => {
    // Remove parenthetical content for counting
    const withoutParens = text.replace(/\s*\([^\)]+\)/, '');
    const matches = withoutParens.match(/[\u4e00-\u9fff]/g);
    return matches ? matches.length : 0;
  };

  // Calculate font size based on prompt length
  const getPromptFontSize = (): string => {
    if (!prompt) return 'text-[40px] md:text-[60px]';

    if (useLargeFont) {
      // For Chinese prompts, scale down based on character count to prevent wrapping
      const charCount = countChineseChars(prompt);
      if (charCount <= 2) return 'text-[80px] md:text-[120px]';
      if (charCount <= 3) return 'text-[70px] md:text-[100px]';
      if (charCount <= 4) return 'text-[60px] md:text-[85px]';
      if (charCount <= 5) return 'text-[50px] md:text-[70px]';
      if (charCount <= 6) return 'text-[42px] md:text-[60px]';
      return 'text-[36px] md:text-[50px]'; // 7+ characters
    }

    // For non-Chinese prompts, scale down based on length
    const length = prompt.length;
    if (length <= 20) return 'text-[40px] md:text-[60px]';
    if (length <= 35) return 'text-[32px] md:text-[48px]';
    if (length <= 50) return 'text-[26px] md:text-[38px]';
    return 'text-[22px] md:text-[32px]';
  };
  const exerciseType = state.currentSession?.exerciseType;
  const isAudio = exerciseType ? isAudioExercise(exerciseType) : false;
  const isEnglishExercise = exerciseType?.endsWith('-english');
  const instructionText = isEnglishExercise
    ? '👉 Type the English meaning:'
    : '👉 Type the tone-number pinyin:';

  // Get audio settings from session (for audio exercises)
  const audioSettings = state.currentSession?.audioSettings;

  // For audio exercises, we need to get the Chinese text to speak
  // The prompt field contains the Chinese characters for audio exercises
  const audioText = isAudio ? state.currentExercise?.words?.[0]?.word : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
          {/* Header - aligned to prompt field width */}
          <div className="mb-8 flex justify-center">
            <div className="max-w-2xl w-full flex justify-between items-center">
              <div className="flex items-center gap-3">
                <h2 className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                  Exercise {exerciseNumber + 1}
                  {showRemainingCount && ` • ${remainingWords} remaining`}
                </h2>
                {state.currentSession?.focusOnWeaknesses && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                    Focus Mode
                  </span>
                )}
              </div>
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
            <div className="max-w-2xl w-full bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl p-12 text-center">
              {isAudio && audioText ? (
                <div className="flex flex-col items-center justify-center min-h-[120px]">
                  <AudioPrompt
                    text={audioText}
                    rate={audioSettings?.speechRate || 'normal'}
                    replayLimit={audioSettings?.replayLimit || 'unlimited'}
                    autoPlay={true}
                    size="large"
                    showReplayCount={true}
                  />
                  <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm">
                    Click to replay audio
                  </p>
                </div>
              ) : (
                <div className={`${getPromptFontSize()} leading-tight font-normal text-gray-900 dark:text-white break-words`}>
                  {promptHasChineseThenParentheses && prompt ? formatPromptWithParentheses(prompt) : state.currentExercise?.prompt}
                </div>
              )}
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
                className="w-full max-w-sm px-6 py-4 text-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all font-mono"
                placeholder="e.g., wo3 ming2 bai2"
                autoComplete="off"
                spellCheck="false"
                autoCorrect="off"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center mt-6">
              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
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
                  state.currentSession.exerciseType === 'audio-to-pinyin' ? 'Audio → Pinyin' :
                  state.currentSession.exerciseType === 'character-to-english' ? 'Character → English' :
                  state.currentSession.exerciseType === 'pinyin-to-english' ? 'Pinyin → English' :
                  state.currentSession.exerciseType === 'audio-to-english' ? 'Audio → English' :
                  'Shuffled (Characters & Pinyin) → English'
                }
                {' • '}
                {state.currentSession.playMode === 'endless' ? 'Endless Practice' : state.currentSession.playMode === 'complete-all' ? 'Complete All' : state.currentSession.playMode === 'speed-drill' ? 'Speed Drill Mode' : 'Drill Mode'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
