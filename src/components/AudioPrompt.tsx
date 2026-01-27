import { useState, useEffect, useCallback, useRef } from 'react';
import type { SpeechRate, ReplayLimit, TTSResult } from '../types/tts';
import { getReplayLimitValue } from '../types/tts';
import { synthesizeSpeech, playAudio, stopAudio } from '../lib/tts/ttsService';

interface AudioPromptProps {
  /** The Chinese text to speak */
  text: string;
  /** Speech rate */
  rate?: SpeechRate;
  /** Replay limit (-1 for unlimited, 0 for no replays) */
  replayLimit?: ReplayLimit;
  /** Auto-play on mount or when text changes */
  autoPlay?: boolean;
  /** Callback when playback starts */
  onPlayStart?: () => void;
  /** Callback when playback ends */
  onPlayEnd?: () => void;
  /** Callback when an error occurs */
  onError?: (error: string) => void;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Whether to show replay count */
  showReplayCount?: boolean;
  /** Custom class name */
  className?: string;
}

export function AudioPrompt({
  text,
  rate = 'normal',
  replayLimit = 'unlimited',
  autoPlay = false,
  onPlayStart,
  onPlayEnd,
  onError,
  size = 'medium',
  showReplayCount = true,
  className = '',
}: AudioPromptProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replaysUsed, setReplaysUsed] = useState(0);

  const audioResultRef = useRef<TTSResult | null>(null);
  const hasAutoPlayedRef = useRef(false);
  const textRef = useRef(text);

  const replayLimitValue = getReplayLimitValue(replayLimit);
  const canReplay = replayLimitValue === -1 || replaysUsed < replayLimitValue;

  // Reset state when text changes
  useEffect(() => {
    if (text !== textRef.current) {
      textRef.current = text;
      hasAutoPlayedRef.current = false;
      setReplaysUsed(0);
      setError(null);
      audioResultRef.current = null;
    }
  }, [text]);

  const play = useCallback(async (isInitialPlay: boolean = false) => {
    if (isPlaying || isLoading) return;
    if (!isInitialPlay && !canReplay) return;

    setIsLoading(true);
    setError(null);
    onPlayStart?.();

    try {
      // Synthesize if we don't have cached audio
      if (!audioResultRef.current) {
        audioResultRef.current = await synthesizeSpeech(text, rate);
      }

      setIsLoading(false);
      setIsPlaying(true);

      await playAudio(audioResultRef.current);

      setIsPlaying(false);

      // Count replay (but not initial play)
      if (!isInitialPlay) {
        setReplaysUsed(prev => prev + 1);
      }

      onPlayEnd?.();
    } catch (err) {
      setIsLoading(false);
      setIsPlaying(false);
      const errorMessage = err instanceof Error ? err.message : 'Playback failed';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [text, rate, isPlaying, isLoading, canReplay, onPlayStart, onPlayEnd, onError]);

  // Auto-play on mount or text change
  useEffect(() => {
    if (autoPlay && !hasAutoPlayedRef.current && text) {
      hasAutoPlayedRef.current = true;
      play(true);
    }
  }, [autoPlay, text, play]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const handleClick = () => {
    if (isPlaying) {
      stopAudio();
      setIsPlaying(false);
    } else {
      play(replaysUsed === 0);
    }
  };

  // Size classes
  const sizeClasses = {
    small: 'w-10 h-10 text-lg',
    medium: 'w-14 h-14 text-2xl',
    large: 'w-20 h-20 text-3xl',
  };

  const replaysRemaining = replayLimitValue === -1 ? -1 : Math.max(0, replayLimitValue - replaysUsed);

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <button
        onClick={handleClick}
        disabled={isLoading || (!canReplay && !isPlaying)}
        className={`
          ${sizeClasses[size]}
          rounded-full flex items-center justify-center
          transition-all duration-200
          ${isLoading
            ? 'bg-gray-300 dark:bg-gray-600 cursor-wait'
            : isPlaying
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
              : canReplay
                ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
          }
        `}
        title={isPlaying ? 'Stop' : canReplay ? 'Play' : 'No replays remaining'}
      >
        {isLoading ? (
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : isPlaying ? (
          <span>⏹</span>
        ) : (
          <span>🔊</span>
        )}
      </button>

      {/* Replay count indicator */}
      {showReplayCount && replayLimitValue !== -1 && replayLimitValue > 0 && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {replaysRemaining === 0 ? (
            <span className="text-red-500 dark:text-red-400">No replays left</span>
          ) : (
            <span>{replaysRemaining} replay{replaysRemaining !== 1 ? 's' : ''} left</span>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="text-xs text-red-500 dark:text-red-400 text-center max-w-xs">
          {error}
        </div>
      )}
    </div>
  );
}

/**
 * Hook for managing audio playback state
 */
export function useAudioPlayback(
  text: string,
  rate: SpeechRate = 'normal',
  replayLimit: ReplayLimit = 'unlimited'
) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replaysUsed, setReplaysUsed] = useState(0);

  const audioResultRef = useRef<TTSResult | null>(null);
  const textRef = useRef(text);

  const replayLimitValue = getReplayLimitValue(replayLimit);
  const canReplay = replayLimitValue === -1 || replaysUsed < replayLimitValue;

  // Reset when text changes
  useEffect(() => {
    if (text !== textRef.current) {
      textRef.current = text;
      setReplaysUsed(0);
      setError(null);
      audioResultRef.current = null;
    }
  }, [text]);

  const play = useCallback(async (countAsReplay: boolean = true) => {
    if (isPlaying || isLoading) return;
    if (countAsReplay && !canReplay) return;

    setIsLoading(true);
    setError(null);

    try {
      if (!audioResultRef.current) {
        audioResultRef.current = await synthesizeSpeech(text, rate);
      }

      setIsLoading(false);
      setIsPlaying(true);

      await playAudio(audioResultRef.current);

      setIsPlaying(false);

      if (countAsReplay) {
        setReplaysUsed(prev => prev + 1);
      }
    } catch (err) {
      setIsLoading(false);
      setIsPlaying(false);
      setError(err instanceof Error ? err.message : 'Playback failed');
    }
  }, [text, rate, isPlaying, isLoading, canReplay]);

  const stop = useCallback(() => {
    stopAudio();
    setIsPlaying(false);
  }, []);

  const reset = useCallback(() => {
    setReplaysUsed(0);
    setError(null);
  }, []);

  return {
    isLoading,
    isPlaying,
    error,
    replaysUsed,
    replaysRemaining: replayLimitValue === -1 ? -1 : Math.max(0, replayLimitValue - replaysUsed),
    canReplay,
    play,
    stop,
    reset,
  };
}
