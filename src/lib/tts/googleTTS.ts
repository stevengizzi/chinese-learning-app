/**
 * Google Cloud Text-to-Speech Provider
 *
 * Uses Google Cloud TTS API for high-quality Mandarin speech synthesis.
 * Requires user to provide their own API key.
 */

import type { TTSProviderInterface, TTSRequest } from '../../types/tts';

/**
 * Google Cloud TTS API endpoint
 */
const GOOGLE_TTS_ENDPOINT = 'https://texttospeech.googleapis.com/v1/text:synthesize';

/**
 * Default voice settings for Mandarin Chinese
 */
const DEFAULT_VOICE = {
  languageCode: 'cmn-CN',  // Mandarin Chinese (China)
  name: 'cmn-CN-Wavenet-A',  // Female WaveNet voice
  ssmlGender: 'FEMALE' as const,
};

/**
 * Alternative voices available
 */
export const GOOGLE_CHINESE_VOICES = [
  { name: 'cmn-CN-Wavenet-A', gender: 'Female', type: 'WaveNet' },
  { name: 'cmn-CN-Wavenet-B', gender: 'Male', type: 'WaveNet' },
  { name: 'cmn-CN-Wavenet-C', gender: 'Male', type: 'WaveNet' },
  { name: 'cmn-CN-Wavenet-D', gender: 'Female', type: 'WaveNet' },
  { name: 'cmn-CN-Standard-A', gender: 'Female', type: 'Standard' },
  { name: 'cmn-CN-Standard-B', gender: 'Male', type: 'Standard' },
  { name: 'cmn-CN-Standard-C', gender: 'Male', type: 'Standard' },
  { name: 'cmn-CN-Standard-D', gender: 'Female', type: 'Standard' },
];

/**
 * Google Cloud TTS request body
 */
interface GoogleTTSRequestBody {
  input: {
    text?: string;
    ssml?: string;
  };
  voice: {
    languageCode: string;
    name?: string;
    ssmlGender?: 'MALE' | 'FEMALE' | 'NEUTRAL';
  };
  audioConfig: {
    audioEncoding: 'MP3' | 'LINEAR16' | 'OGG_OPUS';
    speakingRate?: number;  // 0.25 to 4.0
    pitch?: number;  // -20.0 to 20.0
    volumeGainDb?: number;  // -96.0 to 16.0
    sampleRateHertz?: number;
  };
}

/**
 * Google Cloud TTS response
 */
interface GoogleTTSResponse {
  audioContent: string;  // Base64 encoded audio
}

/**
 * Google Cloud TTS Provider
 */
export class GoogleCloudTTSProvider implements TTSProviderInterface {
  private apiKey: string;
  private voiceName: string;

  constructor(apiKey: string, voiceName: string = DEFAULT_VOICE.name) {
    this.apiKey = apiKey;
    this.voiceName = voiceName;
  }

  getName(): string {
    return 'Google Cloud TTS';
  }

  async isAvailable(): Promise<boolean> {
    // Check if API key is configured
    if (!this.apiKey || this.apiKey.trim() === '') {
      return false;
    }

    // Optionally validate the API key with a test request
    // For now, just check if key exists
    return true;
  }

  async synthesize(request: TTSRequest): Promise<Blob> {
    if (!this.apiKey) {
      throw new Error('Google Cloud TTS API key not configured');
    }

    const requestBody: GoogleTTSRequestBody = {
      input: {
        text: request.text,
      },
      voice: {
        languageCode: 'cmn-CN',
        name: this.voiceName,
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: request.rate || 1.0,
      },
    };

    const response = await fetch(`${GOOGLE_TTS_ENDPOINT}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Google TTS API error: ${response.status}`;

      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          errorMessage = errorJson.error.message;
        }
      } catch {
        // Use default error message
      }

      throw new Error(errorMessage);
    }

    const data: GoogleTTSResponse = await response.json();

    // Decode base64 audio content
    const binaryString = atob(data.audioContent);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return new Blob([bytes], { type: 'audio/mp3' });
  }
}

/**
 * Validate a Google Cloud API key by making a test request
 */
export async function validateGoogleApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  if (!apiKey || apiKey.trim() === '') {
    return { valid: false, error: 'API key is empty' };
  }

  try {
    const provider = new GoogleCloudTTSProvider(apiKey);
    await provider.synthesize({ text: '你好', rate: 1.0 });
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
