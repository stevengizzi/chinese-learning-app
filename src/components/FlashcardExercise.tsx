import { useEffect, useState, useRef } from 'react';
import type { VocabularyEntry } from '../types/vocabulary';
import type { FlashcardConfig, FlashcardPart } from '../types/flashcard';
import { convertPinyinStringToToneMarks } from '../lib/pinyinToneConverter';
import { AudioPrompt } from './AudioPrompt';

/**
 * Editable field component for flashcard back side
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
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      title="Click to edit"
    >
      {displayValue || value}
      <span className="opacity-0 group-hover:opacity-100 text-gray-400 dark:text-gray-500 text-xs transition-opacity">
        edit
      </span>
    </span>
  );
}

interface FlashcardExerciseProps {
  vocab: VocabularyEntry;
  config: FlashcardConfig;
  isFlipped: boolean;
  onFlip: () => void;
  onAnswer: (correct: boolean) => void;
  onEnd: () => void;
  onEditVocab?: (field: 'word' | 'pinyin' | 'meaning', value: string) => void;
  progress: {
    current: number;
    total?: number;
    remaining: number;
  };
}

/**
 * Render a flashcard part (hanzi, pinyin, english, or audio)
 */
function renderPart(
  part: FlashcardPart,
  vocab: VocabularyEntry,
  isLarge: boolean = false,
  config?: FlashcardConfig,
  autoPlayAudio: boolean = false
): React.ReactNode {
  switch (part) {
    case 'hanzi':
      return (
        <div className={`font-bold text-gray-900 dark:text-white ${isLarge ? 'text-6xl md:text-8xl' : 'text-4xl md:text-5xl'}`}>
          {vocab.word}
        </div>
      );
    case 'pinyin':
      return (
        <div className={`text-blue-600 dark:text-blue-400 ${isLarge ? 'text-3xl md:text-4xl' : 'text-2xl md:text-3xl'}`}>
          {convertPinyinStringToToneMarks(vocab.pinyin)}
        </div>
      );
    case 'english':
      return (
        <div className={`text-gray-700 dark:text-gray-300 ${isLarge ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'}`}>
          {vocab.meaning}
        </div>
      );
    case 'audio':
      return (
        <div className="flex flex-col items-center">
          <AudioPrompt
            text={vocab.word}
            rate={config?.audioSettings?.speechRate || 'normal'}
            replayLimit={config?.audioSettings?.replayLimit || 'unlimited'}
            autoPlay={autoPlayAudio}
            size={isLarge ? 'large' : 'medium'}
            showReplayCount={true}
          />
        </div>
      );
  }
}

export function FlashcardExercise({
  vocab,
  config,
  isFlipped,
  onFlip,
  onAnswer,
  onEnd,
  onEditVocab,
  progress,
}: FlashcardExerciseProps) {
  const { sideConfig } = config;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (!isFlipped) {
        // Before flip: Enter or Space to flip
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onFlip();
        }
      } else {
        // After flip: 1 or Left for wrong, 2 or Right for correct
        if (e.key === '1' || e.key === 'ArrowLeft') {
          e.preventDefault();
          onAnswer(false);
        } else if (e.key === '2' || e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onAnswer(true);
        }
      }

      // Escape to end
      if (e.key === 'Escape') {
        e.preventDefault();
        onEnd();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, onFlip, onAnswer, onEnd]);

  const frontParts = sideConfig.front;
  const backParts = sideConfig.back;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 flex flex-col p-6">
      {/* Progress Bar */}
      <div className="w-full max-w-3xl mx-auto mb-4">
        <div className="flex justify-between items-center mb-2">
          <button
            onClick={onEnd}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm font-medium"
          >
            ← End Session
          </button>
          <div className="text-gray-600 dark:text-gray-400 text-sm">
            {progress.total
              ? `${progress.current} / ${progress.total}`
              : `Card ${progress.current}`}
            {config.playMode === 'drill' && progress.remaining > 1 && (
              <span className="ml-2 text-rose-600 dark:text-rose-400">
                ({progress.remaining} remaining)
              </span>
            )}
          </div>
        </div>
        {progress.total && (
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Flashcard */}
      <div className="flex-1 flex items-center justify-center">
        <div
          className={`w-full max-w-2xl aspect-[3/2] bg-white dark:bg-gray-800 rounded-3xl shadow-2xl flex flex-col items-center justify-center p-8 cursor-pointer transition-all duration-300 ${
            !isFlipped ? 'hover:shadow-3xl hover:scale-[1.02]' : ''
          }`}
          onClick={!isFlipped ? onFlip : undefined}
        >
          {!isFlipped ? (
            // Front Side
            <div className="text-center space-y-4">
              {frontParts.map((part, idx) => (
                <div key={part}>
                  {renderPart(part, vocab, idx === 0, config, part === 'audio')}
                </div>
              ))}
              <div className="mt-8 text-gray-400 dark:text-gray-500 text-sm">
                Press Enter or tap to flip
              </div>
            </div>
          ) : (
            // Back Side (Answer)
            <div className="text-center space-y-4">
              {/* Show front parts smaller at top */}
              <div className="opacity-60 space-y-1 mb-4">
                {frontParts.map((part) => (
                  <div key={part} className="text-lg text-gray-600 dark:text-gray-400">
                    {part === 'hanzi' && vocab.word}
                    {part === 'pinyin' && convertPinyinStringToToneMarks(vocab.pinyin)}
                    {part === 'english' && vocab.meaning}
                    {part === 'audio' && '(Audio)'}
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="w-24 h-0.5 bg-gray-200 dark:bg-gray-600 mx-auto" />

              {/* Back parts (the answer) - editable */}
              <div className="space-y-3 pt-2">
                {backParts.map((part, idx) => {
                  const isLarge = idx === 0;
                  if (part === 'audio') {
                    // Audio part - auto-play when back side is shown
                    return (
                      <div key={part}>
                        {renderPart(part, vocab, isLarge, config, true)}
                      </div>
                    );
                  }
                  if (part === 'hanzi') {
                    return (
                      <div key={part}>
                        {onEditVocab ? (
                          <EditableField
                            value={vocab.word}
                            onSave={(v) => onEditVocab('word', v)}
                            fontSize={`font-bold ${isLarge ? 'text-6xl md:text-8xl' : 'text-4xl md:text-5xl'}`}
                            textColor="text-gray-900 dark:text-white"
                          />
                        ) : (
                          renderPart(part, vocab, isLarge, config)
                        )}
                      </div>
                    );
                  }
                  if (part === 'pinyin') {
                    return (
                      <div key={part}>
                        {onEditVocab ? (
                          <EditableField
                            value={vocab.pinyin}
                            displayValue={convertPinyinStringToToneMarks(vocab.pinyin)}
                            onSave={(v) => onEditVocab('pinyin', v)}
                            fontSize={isLarge ? 'text-3xl md:text-4xl' : 'text-2xl md:text-3xl'}
                            textColor="text-blue-600 dark:text-blue-400"
                          />
                        ) : (
                          renderPart(part, vocab, isLarge, config)
                        )}
                      </div>
                    );
                  }
                  if (part === 'english') {
                    return (
                      <div key={part}>
                        {onEditVocab ? (
                          <EditableField
                            value={vocab.meaning}
                            onSave={(v) => onEditVocab('meaning', v)}
                            fontSize={isLarge ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'}
                            textColor="text-gray-700 dark:text-gray-300"
                          />
                        ) : (
                          renderPart(part, vocab, isLarge, config)
                        )}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-2xl mx-auto mt-6">
        {!isFlipped ? (
          <button
            onClick={onFlip}
            className="w-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl text-lg"
          >
            Flip Card (Enter)
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => onAnswer(false)}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <span className="text-2xl">✗</span>
              <span>Wrong (1)</span>
            </button>
            <button
              onClick={() => onAnswer(true)}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <span className="text-2xl">✓</span>
              <span>Correct (2)</span>
            </button>
          </div>
        )}
      </div>

      {/* Keyboard Hints */}
      <div className="text-center mt-4 text-gray-500 dark:text-gray-400 text-sm">
        {!isFlipped ? (
          <span>Enter/Space: Flip • Esc: End</span>
        ) : (
          <span>1/←: Wrong • 2/→/Enter: Correct • Esc: End</span>
        )}
      </div>
    </div>
  );
}
