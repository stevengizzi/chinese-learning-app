import { useState, useRef, useEffect } from 'react';
import type { Sentence, SentenceAttempt, SentenceReadingSession } from '../types/sentenceReading';
import { comparePinyinDetailed } from '../lib/pinyinNormalizer';
import { convertPinyinStringToToneMarks } from '../lib/pinyinToneConverter';

interface SentenceReadingExerciseProps {
  sentence: Sentence;
  session: SentenceReadingSession;
  onSubmitAttempt: (attempt: SentenceAttempt) => void;
  onEnd: () => void;
}

type ExercisePhase = 'input' | 'feedback';

export function SentenceReadingExercise({
  sentence,
  session,
  onSubmitAttempt,
  onEnd,
}: SentenceReadingExerciseProps) {
  const [phase, setPhase] = useState<ExercisePhase>('input');
  const [pinyinInput, setPinyinInput] = useState('');
  const [translationInput, setTranslationInput] = useState('');
  const [startTime] = useState(Date.now());
  const [pinyinResult, setPinyinResult] = useState<ReturnType<typeof comparePinyinDetailed> | null>(null);

  const pinyinInputRef = useRef<HTMLInputElement>(null);
  const meaningButtonRef = useRef<HTMLButtonElement>(null);

  // Focus pinyin input on mount
  useEffect(() => {
    if (phase === 'input') {
      pinyinInputRef.current?.focus();
    }
  }, [phase, sentence.id]);

  // Focus first button in feedback phase
  useEffect(() => {
    if (phase === 'feedback') {
      meaningButtonRef.current?.focus();
    }
  }, [phase]);

  // Calculate progress
  const currentIndex = session.currentIndex;
  const totalSentences = session.sentenceOrder.length;
  const progressPercent = ((currentIndex) / totalSentences) * 100;

  const handleCheckAnswer = () => {
    const result = comparePinyinDetailed(pinyinInput, sentence.pinyin);
    setPinyinResult(result);
    setPhase('feedback');
  };

  const handleMeaningAssessment = (gotIt: boolean) => {
    const attempt: SentenceAttempt = {
      sentenceId: sentence.id,
      userPinyin: pinyinInput,
      userTranslation: translationInput,
      pinyinCorrect: pinyinResult?.isCorrect ?? false,
      meaningCorrect: gotIt,
      timeMs: Date.now() - startTime,
    };
    onSubmitAttempt(attempt);

    // Reset for next sentence
    setPinyinInput('');
    setTranslationInput('');
    setPinyinResult(null);
    setPhase('input');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && phase === 'input') {
      e.preventDefault();
      handleCheckAnswer();
    }
  };

  // Calculate font size based on sentence length
  const getFontSize = (text: string) => {
    const length = text.length;
    if (length <= 6) return 'text-[60px] md:text-[80px]';
    if (length <= 10) return 'text-[48px] md:text-[64px]';
    if (length <= 15) return 'text-[36px] md:text-[48px]';
    if (length <= 20) return 'text-[28px] md:text-[36px]';
    return 'text-[24px] md:text-[28px]';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Sentence {currentIndex + 1} of {totalSentences}</span>
              <span>Difficulty: {sentence.difficulty}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Sentence Display */}
          <div className="text-center mb-8">
            <div className={`${getFontSize(sentence.hanzi)} font-normal text-gray-900 dark:text-white leading-tight`}>
              {sentence.hanzi}
            </div>
          </div>

          {phase === 'input' ? (
            <>
              {/* Pinyin Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Write the pinyin:
                </label>
                <input
                  ref={pinyinInputRef}
                  type="text"
                  value={pinyinInput}
                  onChange={e => setPinyinInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g., wo3 jin1 tian1 or wǒ jīn tiān"
                  className="w-full px-4 py-3 text-lg font-mono border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-amber-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                />
              </div>

              {/* Translation Input */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Write the English meaning:
                </label>
                <input
                  type="text"
                  value={translationInput}
                  onChange={e => setTranslationInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g., I took a taxi home today."
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-amber-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={onEnd}
                  className="flex-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-semibold py-4 px-8 rounded-xl transition-colors duration-200"
                >
                  End Session
                </button>
                <button
                  onClick={handleCheckAnswer}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-4 px-8 rounded-xl transition-colors duration-200"
                >
                  Check Answer
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Feedback Phase */}
              <div className="space-y-6">
                {/* Pinyin Feedback */}
                <div className={`p-6 rounded-xl border-2 ${
                  pinyinResult?.isCorrect
                    ? 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700'
                    : 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700'
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-2xl ${pinyinResult?.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                      {pinyinResult?.isCorrect ? '✓' : '✗'}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      Pinyin {pinyinResult?.isCorrect ? 'Correct!' : 'Incorrect'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Your answer:</div>
                    <div className="font-mono text-lg text-gray-900 dark:text-white">
                      {pinyinInput || '(empty)'}
                    </div>
                  </div>

                  <div className="space-y-2 mt-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Correct pinyin:</div>
                    <div className="font-mono text-lg text-gray-900 dark:text-white">
                      {convertPinyinStringToToneMarks(sentence.pinyin)}
                    </div>
                    <div className="font-mono text-sm text-gray-500 dark:text-gray-400">
                      ({sentence.pinyin})
                    </div>
                  </div>

                  {/* Syllable-by-syllable breakdown if incorrect */}
                  {!pinyinResult?.isCorrect && pinyinResult?.syllableResults && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Syllable breakdown:</div>
                      <div className="flex flex-wrap gap-2">
                        {pinyinResult.syllableResults.map((result, i) => (
                          <span
                            key={i}
                            className={`px-2 py-1 rounded font-mono text-sm ${
                              result.isCorrect
                                ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200'
                                : result.toneError
                                ? 'bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200'
                                : 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200'
                            }`}
                          >
                            {result.user || '?'} → {result.correct}
                            {result.toneError && ' (tone)'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Translation Feedback */}
                <div className="p-6 rounded-xl border-2 bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700">
                  <div className="font-semibold text-gray-900 dark:text-white mb-3">
                    Translation
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Your translation:</div>
                    <div className="text-lg text-gray-900 dark:text-white">
                      {translationInput || '(empty)'}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Reference translations:</div>
                    <ul className="space-y-1">
                      {sentence.translations.map((t, i) => (
                        <li key={i} className="text-lg text-gray-900 dark:text-white">
                          • {t}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 pt-4 border-t border-blue-200 dark:border-blue-600">
                    <div className="text-center text-gray-700 dark:text-gray-300 mb-4">
                      Did you get the meaning correct?
                    </div>
                    <div className="flex gap-4 justify-center">
                      <button
                        ref={meaningButtonRef}
                        onClick={() => handleMeaningAssessment(true)}
                        className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors duration-200"
                      >
                        Yes, I got it
                      </button>
                      <button
                        onClick={() => handleMeaningAssessment(false)}
                        className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors duration-200"
                      >
                        No, I missed it
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
