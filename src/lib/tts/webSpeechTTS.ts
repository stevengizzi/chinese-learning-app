/**
 * Web Speech API TTS Provider
 *
 * Uses the browser's built-in speech synthesis for TTS.
 * Quality varies by browser/OS, but works offline and requires no API key.
 */

import type { TTSProviderInterface, TTSRequest } from '../../types/tts';

/**
 * Get available Chinese voices
 */
async function getChineseVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const voices = speechSynthesis.getVoices();

    if (voices.length > 0) {
      resolve(voices.filter(v => v.lang.startsWith('zh')));
      return;
    }

    // Chrome loads voices asynchronously
    speechSynthesis.onvoiceschanged = () => {
      const loadedVoices = speechSynthesis.getVoices();
      resolve(loadedVoices.filter(v => v.lang.startsWith('zh')));
    };

    // Timeout fallback
    setTimeout(() => {
      const fallbackVoices = speechSynthesis.getVoices();
      resolve(fallbackVoices.filter(v => v.lang.startsWith('zh')));
    }, 1000);
  });
}

/**
 * Select the best available Chinese voice
 */
async function selectBestVoice(preferredVoiceName?: string): Promise<SpeechSynthesisVoice | null> {
  const voices = await getChineseVoices();

  if (voices.length === 0) {
    return null;
  }

  // If a preferred voice is specified and available, use it
  if (preferredVoiceName) {
    const preferred = voices.find(v => v.name === preferredVoiceName);
    if (preferred) {
      return preferred;
    }
  }

  // Prefer zh-CN over other variants
  const zhCN = voices.filter(v => v.lang === 'zh-CN');
  if (zhCN.length > 0) {
    // Prefer local voices (work offline)
    const local = zhCN.find(v => v.localService);
    if (local) return local;
    return zhCN[0];
  }

  // Fall back to any Chinese voice
  const local = voices.find(v => v.localService);
  if (local) return local;

  return voices[0];
}

/**
 * Web Speech TTS Provider
 */
export class WebSpeechTTSProvider implements TTSProviderInterface {
  private preferredVoiceName?: string;

  constructor(preferredVoiceName?: string) {
    this.preferredVoiceName = preferredVoiceName;
  }

  getName(): string {
    return 'Web Speech API';
  }

  async isAvailable(): Promise<boolean> {
    if (!('speechSynthesis' in window)) {
      return false;
    }

    const voices = await getChineseVoices();
    return voices.length > 0;
  }

  async synthesize(request: TTSRequest): Promise<Blob> {
    const voice = await selectBestVoice(this.preferredVoiceName);

    if (!voice) {
      throw new Error('No Chinese voice available');
    }

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(request.text);
      utterance.voice = voice;
      utterance.lang = request.language || 'zh-CN';
      utterance.rate = request.rate || 1.0;

      // Web Speech API doesn't give us audio data directly,
      // so we need to use MediaRecorder to capture the audio output.
      // However, this doesn't work reliably across browsers.
      // Instead, we'll return a special marker and handle playback differently.

      // For Web Speech API, we'll use a different approach:
      // Return a "fake" blob that signals to use direct speech synthesis
      const markerData = JSON.stringify({
        type: 'web-speech-direct',
        text: request.text,
        rate: request.rate || 1.0,
        lang: request.language || 'zh-CN',
        voiceName: voice.name,
      });

      const blob = new Blob([markerData], { type: 'application/json' });
      resolve(blob);
    });
  }

  /**
   * Play audio directly using Web Speech API
   * (Used when synthesize returns a marker blob)
   */
  static async playDirect(
    text: string,
    rate: number = 1.0,
    lang: string = 'zh-CN',
    voiceName?: string
  ): Promise<void> {
    const voice = await selectBestVoice(voiceName);

    if (!voice) {
      throw new Error('No Chinese voice available');
    }

    return new Promise((resolve, reject) => {
      // Cancel any ongoing speech
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = voice;
      utterance.lang = lang;
      utterance.rate = rate;

      utterance.onend = () => {
        resolve();
      };

      utterance.onerror = (event) => {
        // 'interrupted' and 'canceled' are not real errors
        if (event.error === 'interrupted' || event.error === 'canceled') {
          resolve();
          return;
        }
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      speechSynthesis.speak(utterance);
    });
  }

  /**
   * Stop any ongoing speech
   */
  static stop(): void {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  }
}

/**
 * Get list of available Chinese voices for settings UI
 */
export async function getAvailableChineseVoices(): Promise<{ name: string; lang: string; local: boolean }[]> {
  const voices = await getChineseVoices();
  return voices.map(v => ({
    name: v.name,
    lang: v.lang,
    local: v.localService,
  }));
}

/**
 * Check if a blob is a Web Speech direct marker
 */
export function isWebSpeechDirectMarker(blob: Blob): boolean {
  return blob.type === 'application/json';
}

/**
 * Parse Web Speech direct marker
 */
export async function parseWebSpeechMarker(blob: Blob): Promise<{
  text: string;
  rate: number;
  lang: string;
  voiceName?: string;
} | null> {
  if (!isWebSpeechDirectMarker(blob)) {
    return null;
  }

  try {
    const text = await blob.text();
    const data = JSON.parse(text);

    if (data.type !== 'web-speech-direct') {
      return null;
    }

    return {
      text: data.text,
      rate: data.rate,
      lang: data.lang,
      voiceName: data.voiceName,
    };
  } catch {
    return null;
  }
}
