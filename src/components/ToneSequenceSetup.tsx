import { useState, useEffect } from 'react';
import type { ToneNumber, ToneSequenceConfig } from '../types/toneSequence';
import { DEFAULT_SANDHI_RULES } from '../lib/toneSequence/toneSandhiRules';

interface ToneSequenceSetupProps {
  onStart: (config: ToneSequenceConfig) => void;
  onBack: () => void;
}

const STORAGE_KEY = 'toneSequenceSettings';

interface StoredSettings {
  activeTones: number[];
  difficultyMin: number;
  difficultyMax: number;
  excludedSyllablesText: string;
  sandhiRules: typeof DEFAULT_SANDHI_RULES;
  sequenceLength: number;
  bpm: number;
}

export function ToneSequenceSetup({ onStart, onBack }: ToneSequenceSetupProps) {
  // Load saved settings from localStorage
  const loadSavedSettings = (): StoredSettings | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  };

  const savedSettings = loadSavedSettings();

  // Tone selection (all enabled by default, or load from storage)
  const [activeTones, setActiveTones] = useState<Set<ToneNumber>>(
    savedSettings?.activeTones
      ? new Set(savedSettings.activeTones as ToneNumber[])
      : new Set([1, 2, 3, 4, 5] as ToneNumber[])
  );

  // Difficulty range
  const [difficultyMin, setDifficultyMin] = useState(savedSettings?.difficultyMin ?? 1);
  const [difficultyMax, setDifficultyMax] = useState(savedSettings?.difficultyMax ?? 5);

  // Excluded syllables
  const [excludedSyllablesText, setExcludedSyllablesText] = useState(savedSettings?.excludedSyllablesText ?? '');

  // Sandhi rules
  const [sandhiRules, setSandhiRules] = useState(savedSettings?.sandhiRules ?? DEFAULT_SANDHI_RULES);

  // Exercise parameters
  const [sequenceLength, setSequenceLength] = useState(savedSettings?.sequenceLength ?? 4);
  const [bpm, setBPM] = useState(savedSettings?.bpm ?? 120);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    const settings: StoredSettings = {
      activeTones: Array.from(activeTones),
      difficultyMin,
      difficultyMax,
      excludedSyllablesText,
      sandhiRules,
      sequenceLength,
      bpm,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [activeTones, difficultyMin, difficultyMax, excludedSyllablesText, sandhiRules, sequenceLength, bpm]);

  const toggleTone = (tone: ToneNumber) => {
    const newTones = new Set(activeTones);
    if (newTones.has(tone)) {
      newTones.delete(tone);
    } else {
      newTones.add(tone);
    }
    setActiveTones(newTones);
  };

  const toggleSandhiRule = (ruleId: string) => {
    setSandhiRules(prevRules =>
      prevRules.map(rule =>
        rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
      )
    );
  };

  const handleStart = () => {
    // Parse excluded syllables (comma or space separated)
    const excludedSet = new Set(
      excludedSyllablesText
        .split(/[,\s]+/)
        .map(s => s.trim().toLowerCase())
        .filter(s => s.length > 0)
    );

    const config: ToneSequenceConfig = {
      activeTones,
      difficultyRange: [difficultyMin, difficultyMax],
      excludedSyllables: excludedSet,
      sandhiRules,
      sequenceLength,
      bpm,
    };

    onStart(config);
  };

  const toneInfo = [
    { number: 1 as ToneNumber, name: 'Tone 1', symbol: 'ˉ', example: 'mā' },
    { number: 2 as ToneNumber, name: 'Tone 2', symbol: 'ˊ', example: 'má' },
    { number: 3 as ToneNumber, name: 'Tone 3', symbol: 'ˇ', example: 'mǎ' },
    { number: 4 as ToneNumber, name: 'Tone 4', symbol: 'ˋ', example: 'mà' },
    { number: 5 as ToneNumber, name: 'Neutral', symbol: '', example: 'ma' },
  ];

  const isValid = activeTones.size > 0 && difficultyMin <= difficultyMax;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Tone Sequence Trainer
            </h1>
            <p className="text-gray-600">
              Configure your tone practice session
            </p>
          </div>

          {/* Tone Selection */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Select Active Tones
            </h2>
            <div className="grid grid-cols-5 gap-3">
              {toneInfo.map(tone => (
                <button
                  key={tone.number}
                  onClick={() => toggleTone(tone.number)}
                  className={`p-4 rounded-lg border-2 transition-all relative ${
                    activeTones.has(tone.number)
                      ? 'bg-blue-500 border-blue-600 text-white shadow-lg scale-105'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  {activeTones.has(tone.number) && (
                    <div className="absolute top-1 right-1 text-white font-bold text-xs">✓</div>
                  )}
                  <div className="text-sm font-medium">{tone.name}</div>
                  <div className="text-2xl font-bold mt-1">{tone.example}</div>
                  <div className="text-xs mt-1">{tone.symbol || '(neutral)'}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Range */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Syllable Difficulty Range (1-5)
            </h2>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum: {difficultyMin}
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={difficultyMin}
                  onChange={e => setDifficultyMin(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum: {difficultyMax}
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={difficultyMax}
                  onChange={e => setDifficultyMax(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Difficulty factors: retroflex initials (zh, ch, sh, r), alveolo-palatals (j, q, x),
              complex finals, tight vowel articulation
            </p>
          </div>

          {/* Excluded Syllables */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Excluded Syllables (Optional)
            </h2>
            <input
              type="text"
              value={excludedSyllablesText}
              onChange={e => setExcludedSyllablesText(e.target.value)}
              placeholder="e.g., zhi, chi, ri (comma or space separated)"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Sandhi Rules */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Tone Sandhi Rules
            </h2>
            <div className="space-y-3">
              {sandhiRules.map(rule => (
                <label
                  key={rule.id}
                  className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={() => toggleSandhiRule(rule.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{rule.name}</div>
                    <div className="text-sm text-gray-600">{rule.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Exercise Parameters */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Exercise Parameters
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sequence Length: {sequenceLength} syllables
                </label>
                <input
                  type="range"
                  min="2"
                  max="8"
                  value={sequenceLength}
                  onChange={e => setSequenceLength(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Metronome BPM: {bpm}
                </label>
                <input
                  type="range"
                  min="60"
                  max="200"
                  value={bpm}
                  onChange={e => setBPM(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onBack}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-4 px-8 rounded-xl transition-colors duration-200"
            >
              ← Back to Menu
            </button>
            <button
              onClick={handleStart}
              disabled={!isValid}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-8 rounded-xl transition-colors duration-200"
            >
              Start Exercise
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
