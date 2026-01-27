import { useState, useEffect, useRef } from 'react';
import { useExercise } from '../contexts/ExerciseContext';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { parseExampleSentences, findMatchingSentences, type ExampleSentence } from '../lib/exampleSentences';
import { SpeedFeedback } from './SpeedFeedback';
import { convertPinyinStringToToneMarks } from '../lib/pinyinToneConverter';

/**
 * Editable field component for vocabulary card
 */
function EditableField({
  value,
  displayValue,
  onSave,
  fontSize = 'text-base',
  textColor = 'text-gray-600 dark:text-gray-300',
}: {
  value: string;
  displayValue?: string;
  onSave: (newValue: string) => void;
  fontSize?: string;
  textColor?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== value) {
      onSave(trimmed);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={`${fontSize} px-2 py-1 border-2 border-blue-500 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none text-center w-full max-w-md`}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <span
      className={`${fontSize} ${textColor} cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded px-2 py-0.5 transition-colors group inline-flex items-center gap-1`}
      onClick={() => setIsEditing(true)}
      title="Click to edit"
    >
      {displayValue || value}
      <span className="opacity-0 group-hover:opacity-100 text-gray-400 dark:text-gray-500 text-xs transition-opacity">
        edit
      </span>
    </span>
  );
}

export function FeedbackScreen() {
  const { state, dispatch } = useExercise();
  const [exampleSentences, setExampleSentences] = useState<ExampleSentence[]>([]);

  const handleNext = () => {
    dispatch({ type: 'NEXT_EXERCISE' });
  };

  const handleBackToMenu = () => {
    dispatch({ type: 'BACK_TO_MENU' });
  };

  useKeyboardShortcuts({
    onEnter: handleNext
  });

  // Load example sentences when component mounts or exercise changes
  useEffect(() => {
    async function loadExampleSentences() {
      if (!state.currentExercise) {
        console.log('No current exercise');
        return;
      }

      try {
        console.log('Fetching example sentences...');
        // Fetch the example sentences text file
        // Use import.meta.env.BASE_URL to account for GitHub Pages base path
        const response = await fetch(`${import.meta.env.BASE_URL}docs/hsk_1_4.txt`);

        if (!response.ok) {
          console.error('Failed to fetch example sentences:', response.status, response.statusText);
          setExampleSentences([]);
          return;
        }

        const textContent = await response.text();
        console.log('Text content length:', textContent.length);

        // Parse the text file
        const allSentences = parseExampleSentences(textContent);
        console.log('Total sentences parsed:', allSentences.length);

        // Find sentences that match the current word (character)
        const currentWord = state.currentExercise.words[0].word;
        console.log('Looking for sentences containing:', currentWord);

        const matchingSentences = findMatchingSentences(allSentences, currentWord, 2);
        console.log('Matching sentences found:', matchingSentences.length);

        setExampleSentences(matchingSentences);
      } catch (error) {
        console.error('Failed to load example sentences:', error);
        setExampleSentences([]);
      }
    }

    loadExampleSentences();
  }, [state.currentExercise]);

  if (!state.currentAttempt) return null;

  const { score, errors, correctAnswer, userAnswer } = state.currentAttempt;
  const isCorrect = score.correct === score.total;
  const percentage = Math.round((score.correct / score.total) * 100);

  // Pad answers for alignment
  const maxLength = Math.max(correctAnswer.length, userAnswer.length);
  const paddedCorrect = correctAnswer.padEnd(maxLength);
  const paddedUser = userAnswer.padEnd(maxLength);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
          {/* Centered Content Container */}
          <div className="max-w-2xl mx-auto">
            {/* Score Badge */}
            <div className="flex justify-end mb-4">
              <button
                onClick={handleBackToMenu}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm font-medium"
              >
                ← Back to Menu
              </button>
            </div>

            <div className="text-center mb-4">
            {isCorrect ? (
              <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 px-6 py-2 rounded-full text-lg font-semibold">
                <span className="text-2xl">✅</span>
                <span>Perfect! {score.correct} / {score.total} correct</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 px-6 py-2 rounded-full text-lg font-semibold">
                <span className="text-2xl">📊</span>
                <span>Score: {score.correct} / {score.total} ({percentage}%)</span>
              </div>
            )}
            </div>

            {/* Vocabulary Context Card */}
            {state.currentExercise?.words[0] && (() => {
              const vocab = state.currentExercise.words[0];
              const charCount = vocab.word.length;
              // Scale font size based on character count
              const fontSize = charCount <= 2 ? 'text-5xl' :
                              charCount <= 3 ? 'text-4xl' :
                              charCount <= 4 ? 'text-3xl' :
                              charCount <= 5 ? 'text-2xl' : 'text-xl';

              const handleFieldEdit = (field: 'word' | 'pinyin' | 'meaning', value: string) => {
                dispatch({ type: 'UPDATE_CURRENT_VOCAB', payload: { field, value } });
              };

              return (
                <div className={`mb-4 ${isCorrect ? 'bg-green-50 dark:bg-green-900/20' : 'bg-amber-50 dark:bg-amber-900/20'} border-2 ${isCorrect ? 'border-green-200 dark:border-green-700' : 'border-amber-200 dark:border-amber-700'} rounded-xl p-4 text-center`}>
                  <div className="mb-1">
                    <EditableField
                      value={vocab.word}
                      onSave={(v) => handleFieldEdit('word', v)}
                      fontSize={`${fontSize} font-normal`}
                      textColor="text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="mb-1">
                    <EditableField
                      value={vocab.pinyin}
                      displayValue={convertPinyinStringToToneMarks(vocab.pinyin)}
                      onSave={(v) => handleFieldEdit('pinyin', v)}
                      fontSize="text-lg"
                      textColor="text-gray-500 dark:text-gray-400"
                    />
                  </div>
                  <div>
                    <EditableField
                      value={vocab.meaning}
                      onSave={(v) => handleFieldEdit('meaning', v)}
                      fontSize="text-base"
                      textColor="text-gray-600 dark:text-gray-300"
                    />
                  </div>
                </div>
              );
            })()}

            {/* Comparison View */}
            <div className="mb-4">
              <h3 className="text-gray-700 dark:text-gray-200 font-semibold mb-2 text-lg">Comparison:</h3>
              <div className="bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl p-4 font-mono text-lg">
              <div className="mb-2">
                <span className={`${isCorrect ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'} font-medium`}>
                  Correct Answer:
                </span>
                <span className={`ml-4 ${isCorrect ? 'text-green-700 dark:text-green-400' : 'text-gray-900 dark:text-gray-100'}`}>
                  {paddedCorrect}
                </span>
              </div>
              <div>
                <span className={`${isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'} font-medium`}>
                  Your Response :
                </span>
                <span className={`ml-4 ${isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                  {paddedUser}
                </span>
              </div>
              </div>
            </div>

            {/* Error Details */}
            {errors.length > 0 && (
              <div className="mb-4">
                <h3 className="text-gray-700 dark:text-gray-200 font-semibold mb-2 text-lg flex items-center gap-2">
                  <span>⚠️</span>
                  <span>Corrections needed:</span>
                </h3>
                <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-700 rounded-xl p-4">
                <ul className="space-y-3">
                  {errors.map((error, index) => {
                    let message = '';

                    if (error.errorType === 'tone') {
                      const expectedTone = error.expectedPinyin.match(/[1-4]$/)?.[0] || 'neutral';
                      const userTone = error.userPinyin.match(/[1-4]$/)?.[0];

                      if (userTone) {
                        message = `${error.character} is ${error.expectedPinyin} (tone ${expectedTone}) - you used tone ${userTone}`;
                      } else {
                        message = `${error.character} is ${error.expectedPinyin} (tone ${expectedTone}) - tone was missing`;
                      }
                    } else if (error.errorType === 'syllable') {
                      message = `${error.character} is ${error.expectedPinyin} - you typed ${error.userPinyin}`;
                    } else if (error.errorType === 'missing') {
                      message = `${error.character} (${error.expectedPinyin}) was missing`;
                    } else if (error.errorType === 'extra') {
                      message = `Extra syllable: ${error.userPinyin}`;
                    }

                    return (
                      <li key={index} className="text-red-800 dark:text-red-200 flex items-start gap-2">
                        <span className="text-red-600 dark:text-red-400 mt-1">•</span>
                        <span>{message}</span>
                      </li>
                    );
                  })}
                </ul>
                </div>
              </div>
            )}

            {/* Success Message */}
            {isCorrect && (
              <div className="mb-4">
                <div className="bg-green-50 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-700 rounded-xl p-4 text-center">
                  <p className="text-green-800 dark:text-green-200 text-lg font-medium">
                    Excellent work! All syllables and tones are correct.
                  </p>
                </div>
              </div>
            )}

            {/* Speed Feedback */}
            {state.currentSession && state.currentSession.responseTimings.length > 0 && (
              <div className="mb-4">
                <SpeedFeedback
                  responseTimeMs={
                    state.currentSession.responseTimings[
                      state.currentSession.responseTimings.length - 1
                    ]?.responseTimeMs || 0
                  }
                  wordCount={
                    state.currentSession.responseTimings[
                      state.currentSession.responseTimings.length - 1
                    ]?.wordCount || 1
                  }
                  vocabularyId={
                    state.currentSession.responseTimings[
                      state.currentSession.responseTimings.length - 1
                    ]?.vocabularyId || ''
                  }
                  wasCorrect={isCorrect}
                  speedDrillConfig={state.currentSession.speedDrillConfig}
                />
              </div>
            )}

            {/* Example Sentences */}
            {exampleSentences.length > 0 && (
              <div className="mb-4">
                <h3 className="text-gray-700 dark:text-gray-200 font-semibold mb-2 text-lg text-center">Example Sentences:</h3>
                <div className="bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl p-4 space-y-4">
                  {exampleSentences.map((sentence, index) => (
                    <div key={index} className="space-y-1 text-center">
                      <div className="text-xl font-extrabold text-gray-900 dark:text-white">{sentence.hanzi}</div>
                      <div className="text-base text-gray-600 dark:text-gray-300 font-mono">{sentence.pinyin}</div>
                      <div className="text-base text-gray-700 dark:text-gray-200">{sentence.meaning}</div>
                      <div className="my-2">&nbsp;</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next Button */}
            <div className="flex justify-center">
              <button
                onClick={handleNext}
                className="w-full max-w-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-xl transition-colors duration-200 text-lg my-1"
              >
                Next Exercise
              </button>
            </div>

            {/* Session Progress */}
            {state.currentSession && (() => {
              const playMode = state.currentSession.playMode;
              const totalPrompts = state.currentSession.totalPrompts || 0;

              let successfulCompletions = 0;

              if (playMode === 'speed-drill') {
                // For speed-drill: count attempts where answer was correct AND within threshold
                const config = state.currentSession.speedDrillConfig || { baseThresholdMs: 3000, incrementPerWordMs: 1000 };
                successfulCompletions = state.currentSession.responseTimings.filter(timing => {
                  if (!timing.wasCorrect) return false;
                  const threshold = config.baseThresholdMs + Math.max(0, timing.wordCount - 1) * config.incrementPerWordMs;
                  const perWordThreshold = timing.wordCount > 0 ? threshold / timing.wordCount : threshold;
                  const perWordTime = timing.wordCount > 0 ? timing.responseTimeMs / timing.wordCount : timing.responseTimeMs;
                  return perWordTime <= perWordThreshold;
                }).length;
              } else if (playMode === 'drill' || playMode === 'complete-all') {
                // For drill/complete-all: count attempts where answer was correct
                successfulCompletions = state.currentSession.attempts.filter(attempt =>
                  attempt.score.correct === attempt.score.total
                ).length;
              } else {
                // For endless mode: just show total attempts
                successfulCompletions = state.currentSession.attempts.length;
              }

              const showOutOfTotal = playMode === 'complete-all' || playMode === 'drill' || playMode === 'speed-drill';

              return (
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {showOutOfTotal
                      ? `Exercises completed: ${successfulCompletions} out of ${totalPrompts}`
                      : `Exercises completed: ${successfulCompletions}`
                    }
                  </p>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
