import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  StructuralParticleItem,
  StructuralParticleSession,
  StructuralParticleAttempt,
} from '../types/structuralParticle';
import { PARTICLE_INFO } from '../types/structuralParticle';
import { gradeStructuralParticleAnswer } from '../lib/structuralParticleParser';
import { convertPinyinStringToToneMarks } from '../lib/pinyinToneConverter';
import { convertCharacters, loadCharacterSetPreference } from '../lib/characterConverter';

interface StructuralParticleExerciseProps {
  item: StructuralParticleItem;
  session: StructuralParticleSession;
  onSubmitAttempt: (attempt: StructuralParticleAttempt) => void;
  onEnd: () => void;
}

type FeedbackState = {
  shown: boolean;
  isCorrect: boolean;
  userAnswer: string;
  feedback?: string;
};

export function StructuralParticleExercise({
  item,
  session,
  onSubmitAttempt,
  onEnd,
}: StructuralParticleExerciseProps) {
  const [userAnswer, setUserAnswer] = useState('');
  const [feedbackState, setFeedbackState] = useState<FeedbackState>({
    shown: false,
    isCorrect: false,
    userAnswer: '',
  });
  const [startTime, setStartTime] = useState(Date.now());
  const [characterSet] = useState(loadCharacterSetPreference);
  const inputRef = useRef<HTMLInputElement>(null);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const justShowedFeedbackRef = useRef(false);

  const isSpeedMode = session.config.mode === 'speed';
  const showHints = session.config.showHints;
  const progress = session.currentIndex + 1;
  const total = session.itemOrder.length;
  const progressPercent = (progress / total) * 100;
  const particleInfo = PARTICLE_INFO[item.particle];

  // Focus input on mount and when item changes
  useEffect(() => {
    inputRef.current?.focus();
    setStartTime(Date.now());
  }, [item.id]);

  // Clean up auto-advance timer
  useEffect(() => {
    return () => {
      if (autoAdvanceRef.current) {
        clearTimeout(autoAdvanceRef.current);
      }
    };
  }, []);

  const handleSubmit = useCallback(() => {
    if (!userAnswer.trim() || feedbackState.shown) return;

    const timeMs = Date.now() - startTime;
    const result = gradeStructuralParticleAnswer(userAnswer, item.chineseAnswer);

    // Show feedback
    justShowedFeedbackRef.current = true;
    setFeedbackState({
      shown: true,
      isCorrect: result.isCorrect,
      userAnswer: userAnswer.trim(),
      feedback: result.feedback,
    });

    const attempt: StructuralParticleAttempt = {
      itemId: item.id,
      particle: item.particle,
      userAnswer: userAnswer.trim(),
      correctAnswer: item.chineseAnswer,
      isCorrect: result.isCorrect,
      timeMs,
    };

    // In speed mode, auto-advance after a delay
    if (isSpeedMode) {
      const delay = result.isCorrect ? 500 : 1500;
      autoAdvanceRef.current = setTimeout(() => {
        onSubmitAttempt(attempt);
        setUserAnswer('');
        setFeedbackState({
          shown: false,
          isCorrect: false,
          userAnswer: '',
        });
      }, delay);
    }
  }, [userAnswer, feedbackState.shown, startTime, item, isSpeedMode, onSubmitAttempt]);

  const handleNext = useCallback(() => {
    if (!feedbackState.shown) return;

    const timeMs = Date.now() - startTime;
    const result = gradeStructuralParticleAnswer(feedbackState.userAnswer, item.chineseAnswer);

    const attempt: StructuralParticleAttempt = {
      itemId: item.id,
      particle: item.particle,
      userAnswer: feedbackState.userAnswer,
      correctAnswer: item.chineseAnswer,
      isCorrect: result.isCorrect,
      timeMs,
    };

    onSubmitAttempt(attempt);
    setUserAnswer('');
    setFeedbackState({
      shown: false,
      isCorrect: false,
      userAnswer: '',
    });
  }, [feedbackState, startTime, item, onSubmitAttempt]);

  // Handle Enter key at document level when feedback is shown
  useEffect(() => {
    if (!feedbackState.shown || isSpeedMode) return;

    const handleDocumentKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (justShowedFeedbackRef.current) {
          justShowedFeedbackRef.current = false;
          return;
        }
        handleNext();
      }
    };

    document.addEventListener('keydown', handleDocumentKeyDown);
    return () => document.removeEventListener('keydown', handleDocumentKeyDown);
  }, [feedbackState.shown, isSpeedMode, handleNext]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (!feedbackState.shown) {
        handleSubmit();
      } else if (!isSpeedMode) {
        handleNext();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {progress} / {total}
              </span>
              {isSpeedMode && (
                <span className="text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded-full">
                  Speed Mode
                </span>
              )}
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Particle hint */}
          {showHints && (
            <div className="flex justify-center mb-4">
              <span
                className={`px-4 py-1.5 rounded-full text-sm font-medium border-2 ${particleInfo.color.bg} ${particleInfo.color.text} ${particleInfo.color.border}`}
              >
                <span className="text-xl mr-2">{convertCharacters(item.particle, characterSet)}</span>
                {particleInfo.name}
              </span>
            </div>
          )}

          {/* Instruction */}
          <div className="text-center mb-4">
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {item.instruction}
            </p>
          </div>

          {/* Base elements */}
          <div className="text-center mb-4">
            <p className="text-3xl font-medium text-gray-900 dark:text-white">
              {convertCharacters(item.baseElements, characterSet)}
            </p>
          </div>

          {/* English hint */}
          <div className="text-center mb-8">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              ({item.englishHint})
            </p>
          </div>

          {/* Input field */}
          <div className="mb-6">
            <input
              ref={inputRef}
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer..."
              disabled={feedbackState.shown}
              className={`w-full p-4 text-2xl text-center border-2 rounded-xl transition-all ${
                feedbackState.shown
                  ? feedbackState.isCorrect
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800'
              } text-gray-900 dark:text-white`}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
          </div>

          {/* Feedback */}
          {feedbackState.shown && (
            <div
              className={`mb-6 p-4 rounded-xl border-2 ${
                feedbackState.isCorrect
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
              }`}
            >
              {/* Result icon and message */}
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="text-2xl">
                  {feedbackState.isCorrect ? '✓' : '✗'}
                </span>
                <span
                  className={`text-lg font-semibold ${
                    feedbackState.isCorrect
                      ? 'text-green-800 dark:text-green-200'
                      : 'text-red-800 dark:text-red-200'
                  }`}
                >
                  {feedbackState.isCorrect ? 'Correct!' : 'Incorrect'}
                </span>
              </div>

              {/* Correct answer */}
              <div className="text-center">
                <p className="text-2xl text-gray-900 dark:text-white mb-1">
                  {convertCharacters(item.chineseAnswer, characterSet)}
                </p>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  {convertPinyinStringToToneMarks(item.pinyin)}
                </p>
              </div>

              {/* Feedback for incorrect answers */}
              {!feedbackState.isCorrect && feedbackState.feedback && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  {feedbackState.userAnswer && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-2">
                      Your answer: <span className="text-gray-900 dark:text-white">{feedbackState.userAnswer}</span>
                    </p>
                  )}
                  <p className="text-sm text-center text-red-700 dark:text-red-300">
                    {feedbackState.feedback}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-4">
            <button
              onClick={onEnd}
              className="flex-1 py-3 px-6 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold rounded-xl transition-colors"
            >
              End Session
            </button>
            {!feedbackState.shown ? (
              <button
                onClick={handleSubmit}
                disabled={!userAnswer.trim()}
                className={`flex-1 py-3 px-6 font-semibold rounded-xl transition-all ${
                  userAnswer.trim()
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                Check
              </button>
            ) : !isSpeedMode ? (
              <button
                onClick={handleNext}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                Next
              </button>
            ) : (
              <div className="flex-1 py-3 px-6 text-center text-gray-500 dark:text-gray-400">
                Auto-advancing...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
