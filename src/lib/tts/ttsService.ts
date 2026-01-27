/**
 * TTS Service
 *
 * Main abstraction layer for text-to-speech functionality.
 * Routes to appropriate provider and handles caching.
 */

import type { TTSSettings, TTSRequest, TTSResult, TTSProvider } from '../../types/tts';
import { DEFAULT_TTS_SETTINGS, SPEECH_RATE_VALUES, type SpeechRate } from '../../types/tts';
import { GoogleCloudTTSProvider } from './googleTTS';
import {
  WebSpeechTTSProvider,
  isWebSpeechDirectMarker,
  parseWebSpeechMarker,
} from './webSpeechTTS';
import { getCachedAudio, setCachedAudio } from './audioCache';

// LocalStorage key for TTS settings
const TTS_SETTINGS_KEY = 'tts-settings';

// Current audio element for playback
let currentAudio: HTMLAudioElement | null = null;

/**
 * Load TTS settings from localStorage
 */
export function loadTTSSettings(): TTSSettings {
  try {
    const saved = localStorage.getItem(TTS_SETTINGS_KEY);
    if (saved) {
      return { ...DEFAULT_TTS_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (error) {
    console.error('Error loading TTS settings:', error);
  }
  return DEFAULT_TTS_SETTINGS;
}

/**
 * Save TTS settings to localStorage
 */
export function saveTTSSettings(settings: TTSSettings): void {
  try {
    localStorage.setItem(TTS_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving TTS settings:', error);
  }
}

/**
 * Get the active TTS provider based on settings
 */
async function getProvider(settings: TTSSettings): Promise<{ provider: GoogleCloudTTSProvider | WebSpeechTTSProvider; name: TTSProvider }> {
  const { provider: preferredProvider, googleApiKey, preferredVoice } = settings;

  // If explicitly set to Google Cloud
  if (preferredProvider === 'google-cloud') {
    if (googleApiKey) {
      return {
        provider: new GoogleCloudTTSProvider(googleApiKey),
        name: 'google-cloud',
      };
    }
    // Fall through to Web Speech if no API key
  }

  // If explicitly set to Web Speech
  if (preferredProvider === 'web-speech') {
    return {
      provider: new WebSpeechTTSProvider(preferredVoice),
      name: 'web-speech',
    };
  }

  // Auto mode: prefer Google Cloud if available, fall back to Web Speech
  if (googleApiKey) {
    const googleProvider = new GoogleCloudTTSProvider(googleApiKey);
    if (await googleProvider.isAvailable()) {
      return { provider: googleProvider, name: 'google-cloud' };
    }
  }

  // Fall back to Web Speech
  const webSpeechProvider = new WebSpeechTTSProvider(preferredVoice);
  if (await webSpeechProvider.isAvailable()) {
    return { provider: webSpeechProvider, name: 'web-speech' };
  }

  throw new Error('No TTS provider available. Please configure Google Cloud TTS or ensure your browser supports Chinese speech synthesis.');
}

/**
 * Synthesize speech from text
 */
export async function synthesizeSpeech(
  text: string,
  rate: SpeechRate = 'normal',
  settings?: TTSSettings
): Promise<TTSResult> {
  const ttsSettings = settings || loadTTSSettings();
  const rateValue = SPEECH_RATE_VALUES[rate];
  const language = 'zh-CN';

  // Get provider
  const { provider, name: providerName } = await getProvider(ttsSettings);

  // Check cache first (only for Google Cloud, as Web Speech uses direct playback)
  if (providerName === 'google-cloud') {
    const cached = await getCachedAudio(text, rateValue, language, providerName);
    if (cached) {
      const audioUrl = URL.createObjectURL(cached);
      return { audioUrl, cached: true };
    }
  }

  // Synthesize new audio
  const request: TTSRequest = {
    text,
    rate: rateValue,
    language,
  };

  const audioBlob = await provider.synthesize(request);

  // Cache if Google Cloud (not Web Speech markers)
  if (providerName === 'google-cloud' && !isWebSpeechDirectMarker(audioBlob)) {
    await setCachedAudio(text, rateValue, language, providerName, audioBlob);
  }

  const audioUrl = URL.createObjectURL(audioBlob);
  return { audioUrl, cached: false };
}

/**
 * Play synthesized audio
 */
export async function playAudio(result: TTSResult): Promise<void> {
  // Stop any currently playing audio
  stopAudio();

  // Check if this is a Web Speech direct marker
  const response = await fetch(result.audioUrl);
  const blob = await response.blob();

  const webSpeechData = await parseWebSpeechMarker(blob);

  if (webSpeechData) {
    // Use Web Speech API directly
    await WebSpeechTTSProvider.playDirect(
      webSpeechData.text,
      webSpeechData.rate,
      webSpeechData.lang,
      webSpeechData.voiceName
    );
  } else {
    // Play as regular audio
    return new Promise((resolve, reject) => {
      currentAudio = new Audio(result.audioUrl);

      currentAudio.onended = () => {
        currentAudio = null;
        resolve();
      };

      currentAudio.onerror = () => {
        currentAudio = null;
        reject(new Error('Audio playback failed'));
      };

      currentAudio.play().catch(reject);
    });
  }
}

/**
 * Convenience function to synthesize and play in one call
 */
export async function speakText(
  text: string,
  rate: SpeechRate = 'normal',
  settings?: TTSSettings
): Promise<void> {
  const result = await synthesizeSpeech(text, rate, settings);
  await playAudio(result);
}

/**
 * Stop currently playing audio
 */
export function stopAudio(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  WebSpeechTTSProvider.stop();
}

/**
 * Check if audio is currently playing
 */
export function isAudioPlaying(): boolean {
  return currentAudio !== null && !currentAudio.paused;
}

/**
 * Check if TTS is available with current settings
 */
export async function isTTSAvailable(settings?: TTSSettings): Promise<boolean> {
  const ttsSettings = settings || loadTTSSettings();

  try {
    await getProvider(ttsSettings);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the name of the currently active TTS provider
 */
export async function getActiveProviderName(settings?: TTSSettings): Promise<string> {
  const ttsSettings = settings || loadTTSSettings();

  try {
    const { provider } = await getProvider(ttsSettings);
    return provider.getName();
  } catch {
    return 'None available';
  }
}
