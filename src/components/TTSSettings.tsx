import { useState, useEffect } from 'react';
import type { TTSSettings, TTSProvider, SpeechRate } from '../types/tts';
import { SPEECH_RATE_LABELS, DEFAULT_TTS_SETTINGS } from '../types/tts';
import { loadTTSSettings, saveTTSSettings, getActiveProviderName, isTTSAvailable } from '../lib/tts/ttsService';
import { validateGoogleApiKey } from '../lib/tts/googleTTS';

interface TTSSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TTSSettingsModal({ isOpen, onClose }: TTSSettingsModalProps) {
  const [settings, setSettings] = useState<TTSSettings>(DEFAULT_TTS_SETTINGS);
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; error?: string } | null>(null);
  const [activeProvider, setActiveProvider] = useState<string>('');
  const [isAvailable, setIsAvailable] = useState(false);

  // Load settings on mount
  useEffect(() => {
    if (isOpen) {
      const loaded = loadTTSSettings();
      setSettings(loaded);
      setApiKey(loaded.googleApiKey || '');
      setValidationResult(null);

      // Check TTS availability
      checkAvailability(loaded);
    }
  }, [isOpen]);

  const checkAvailability = async (currentSettings: TTSSettings) => {
    const available = await isTTSAvailable(currentSettings);
    setIsAvailable(available);
    const provider = await getActiveProviderName(currentSettings);
    setActiveProvider(provider);
  };

  const handleProviderChange = async (provider: TTSProvider) => {
    const newSettings = { ...settings, provider };
    setSettings(newSettings);
    saveTTSSettings(newSettings);
    await checkAvailability(newSettings);
  };

  const handleRateChange = (rate: SpeechRate) => {
    const newSettings = { ...settings, defaultRate: rate };
    setSettings(newSettings);
    saveTTSSettings(newSettings);
  };

  const handleApiKeyChange = (key: string) => {
    setApiKey(key);
    setValidationResult(null);
  };

  const handleSaveApiKey = async () => {
    const trimmedKey = apiKey.trim();

    if (!trimmedKey) {
      // Clear the API key
      const newSettings = { ...settings, googleApiKey: undefined };
      setSettings(newSettings);
      saveTTSSettings(newSettings);
      setValidationResult({ valid: true });
      await checkAvailability(newSettings);
      return;
    }

    // Validate the API key
    setIsValidating(true);
    const result = await validateGoogleApiKey(trimmedKey);
    setIsValidating(false);
    setValidationResult(result);

    if (result.valid) {
      const newSettings = { ...settings, googleApiKey: trimmedKey };
      setSettings(newSettings);
      saveTTSSettings(newSettings);
      await checkAvailability(newSettings);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            TTS Settings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
          >
            &times;
          </button>
        </div>

        {/* Current Status */}
        <div className={`mb-6 p-4 rounded-xl ${isAvailable ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700' : 'bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-700'}`}>
          <div className="flex items-center gap-2">
            <span className={`text-lg ${isAvailable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {isAvailable ? '✓' : '✗'}
            </span>
            <span className={`font-medium ${isAvailable ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
              {isAvailable ? `Active: ${activeProvider}` : 'TTS not available'}
            </span>
          </div>
        </div>

        {/* Provider Selection */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
            TTS Provider
          </label>
          <div className="space-y-2">
            {[
              { value: 'auto', label: 'Auto (Google Cloud if available, else Web Speech)', description: 'Recommended' },
              { value: 'google-cloud', label: 'Google Cloud TTS', description: 'High quality, requires API key' },
              { value: 'web-speech', label: 'Web Speech API', description: 'Free, built-in browser TTS' },
            ].map(({ value, label, description }) => (
              <label
                key={value}
                className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                  settings.provider === value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700'
                }`}
              >
                <input
                  type="radio"
                  name="provider"
                  value={value}
                  checked={settings.provider === value}
                  onChange={() => handleProviderChange(value as TTSProvider)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{label}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Google Cloud API Key */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Google Cloud API Key
          </label>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            Get a key from{' '}
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Google Cloud Console
            </a>
            . Enable the Text-to-Speech API.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              placeholder="Enter your API key"
              className="flex-1 px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 outline-none"
            />
            <button
              onClick={handleSaveApiKey}
              disabled={isValidating}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
            >
              {isValidating ? 'Validating...' : 'Save'}
            </button>
          </div>
          {validationResult && (
            <div className={`mt-2 text-sm ${validationResult.valid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {validationResult.valid ? '✓ API key saved successfully' : `✗ ${validationResult.error}`}
            </div>
          )}
        </div>

        {/* Default Speech Rate */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Default Speech Rate
          </label>
          <div className="flex gap-2">
            {(Object.entries(SPEECH_RATE_LABELS) as [SpeechRate, string][]).map(([value, label]) => (
              <button
                key={value}
                onClick={() => handleRateChange(value)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  settings.defaultRate === value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-sm text-gray-600 dark:text-gray-400">
          <p className="font-medium text-gray-900 dark:text-white mb-2">About TTS Providers:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Google Cloud TTS:</strong> High-quality Mandarin voices. 4M characters/month free.</li>
            <li><strong>Web Speech API:</strong> Built-in browser TTS. Quality varies by browser/device.</li>
          </ul>
        </div>

        {/* Close Button */}
        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Settings button to trigger TTS settings modal
 */
export function TTSSettingsButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed top-6 right-24 z-50 w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full shadow-lg hover:shadow-xl border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
      aria-label="TTS Settings"
      title="TTS Settings"
    >
      <span className="text-lg">⚙</span>
    </button>
  );
}
