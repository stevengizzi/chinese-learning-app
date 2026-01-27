/**
 * Text-to-Speech Types
 *
 * Types for TTS configuration, providers, and audio playback
 */

/**
 * Available TTS providers
 */
export type TTSProvider = 'google-cloud' | 'web-speech' | 'auto';

/**
 * Speech rate options
 */
export type SpeechRate = 'slow' | 'normal' | 'fast';

/**
 * Speech rate multipliers for each option
 */
export const SPEECH_RATE_VALUES: Record<SpeechRate, number> = {
  slow: 0.7,
  normal: 1.0,
  fast: 1.3,
};

/**
 * Display labels for speech rates
 */
export const SPEECH_RATE_LABELS: Record<SpeechRate, string> = {
  slow: 'Slow',
  normal: 'Normal',
  fast: 'Fast',
};

/**
 * Replay limit options
 */
export type ReplayLimit = 'unlimited' | '3' | '1' | 'none';

/**
 * Display labels for replay limits
 */
export const REPLAY_LIMIT_LABELS: Record<ReplayLimit, string> = {
  unlimited: 'Unlimited',
  '3': '3 replays',
  '1': '1 replay',
  none: 'No replays',
};

/**
 * Get numeric replay limit (-1 for unlimited, 0 for none)
 */
export function getReplayLimitValue(limit: ReplayLimit): number {
  switch (limit) {
    case 'unlimited': return -1;
    case '3': return 3;
    case '1': return 1;
    case 'none': return 0;
  }
}

/**
 * TTS settings stored in localStorage
 */
export interface TTSSettings {
  provider: TTSProvider;
  googleApiKey?: string;
  preferredVoice?: string;  // Voice name for Web Speech API
  defaultRate: SpeechRate;
}

/**
 * Default TTS settings
 */
export const DEFAULT_TTS_SETTINGS: TTSSettings = {
  provider: 'auto',
  defaultRate: 'normal',
};

/**
 * Audio exercise configuration
 */
export interface AudioExerciseConfig {
  speechRate: SpeechRate;
  replayLimit: ReplayLimit;
}

/**
 * Default audio exercise config
 */
export const DEFAULT_AUDIO_EXERCISE_CONFIG: AudioExerciseConfig = {
  speechRate: 'normal',
  replayLimit: 'unlimited',
};

/**
 * Request to synthesize speech
 */
export interface TTSRequest {
  text: string;
  rate?: number;  // 0.5 to 2.0, default 1.0
  language?: string;  // Default 'zh-CN'
}

/**
 * Result from TTS synthesis
 */
export interface TTSResult {
  audioUrl: string;  // Object URL for audio blob
  duration?: number;  // Duration in seconds if known
  cached: boolean;  // Whether this was served from cache
}

/**
 * TTS provider interface
 */
export interface TTSProviderInterface {
  /**
   * Check if this provider is available/configured
   */
  isAvailable(): Promise<boolean>;

  /**
   * Synthesize speech from text
   */
  synthesize(request: TTSRequest): Promise<Blob>;

  /**
   * Get provider name for display
   */
  getName(): string;
}

/**
 * Audio playback state
 */
export interface AudioPlaybackState {
  isLoading: boolean;
  isPlaying: boolean;
  error: string | null;
  replaysRemaining: number;  // -1 for unlimited
}

/**
 * Initial audio playback state
 */
export const INITIAL_PLAYBACK_STATE: AudioPlaybackState = {
  isLoading: false,
  isPlaying: false,
  error: null,
  replaysRemaining: -1,
};

/**
 * Cache entry for stored audio
 */
export interface AudioCacheEntry {
  text: string;
  rate: number;
  language: string;
  provider: string;
  audioBlob: Blob;
  createdAt: number;
}
