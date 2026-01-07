import { useState, useEffect } from 'react';
import { useExercise } from '../contexts/ExerciseContext';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { parseExampleSentences, findMatchingSentences, type ExampleSentence } from '../lib/exampleSentences';

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* Centered Content Container */}
          <div className="flex flex-col items-center">
            {/* Score Badge */}
            <div className="w-1/2 flex justify-end mb-4">
              <button
                onClick={handleBackToMenu}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                ← Back to Menu
              </button>
            </div>

            <div className="text-center mb-8">
            {isCorrect ? (
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-6 py-3 rounded-full text-lg font-semibold">
                <span className="text-2xl">✅</span>
                <span>Perfect! {score.correct} / {score.total} correct</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-6 py-3 rounded-full text-lg font-semibold">
                <span className="text-2xl">📊</span>
                <span>Score: {score.correct} / {score.total} ({percentage}%)</span>
              </div>
            )}
            </div>

            {/* Comparison View */}
            <div className="mb-8 w-1/2">
              <h3 className="text-gray-700 font-semibold mb-3 text-lg">Comparison:</h3>
              <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 font-mono text-lg">
              <div className="mb-2">
                <span className={`${isCorrect ? 'text-green-700' : 'text-gray-700'} font-medium`}>
                  Correct Answer: 
                </span>
                <span className={`ml-4 ${isCorrect ? 'text-green-700' : 'text-gray-900'}`}>
                  {paddedCorrect}
                </span>
              </div>
              <div>
                <span className={`${isCorrect ? 'text-green-700' : 'text-red-700'} font-medium`}>
                  Your Response : 
                </span>
                <span className={`ml-7 ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                  {paddedUser}
                </span>
              </div>
              </div>
            </div>

            {/* Error Details */}
            {errors.length > 0 && (
              <div className="mb-8 w-1/2">
                <h3 className="text-gray-700 font-semibold mb-3 text-lg flex items-center gap-2">
                  <span>⚠️</span>
                  <span>Corrections needed:</span>
                </h3>
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
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
                      <li key={index} className="text-red-800 flex items-start gap-2">
                        <span className="text-red-600 mt-1">•</span>
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
              <div className="mb-8 w-1/2">
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center">
                  <p className="text-green-800 text-lg font-medium">
                    Excellent work! All syllables and tones are correct.
                  </p>
                </div>
              </div>
            )}

            {/* Example Sentences */}
            {exampleSentences.length > 0 && (
              <div className="mb-8 w-1/2">
                <h3 className="text-gray-700 font-semibold mb-4 text-lg text-center">Example Sentences:</h3>
                <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 space-y-6">
                  {exampleSentences.map((sentence, index) => (
                    <div key={index} className="space-y-1 text-center">
                      <div className="text-xl font-extrabold text-gray-900">{sentence.hanzi}</div>
                      <div className="text-base text-gray-600 font-mono">{sentence.pinyin}</div>
                      <div className="text-base text-gray-700">{sentence.meaning}</div>
                      <div className="my-2">&nbsp;</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next Button */}
            <div className="w-1/4">
              <button
                onClick={handleNext}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-xl transition-colors duration-200 text-lg my-1"
              >
                Next Exercise
              </button>
            </div>

            {/* Session Progress */}
            {state.currentSession && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  Exercises completed: {state.currentSession.attempts.length}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
