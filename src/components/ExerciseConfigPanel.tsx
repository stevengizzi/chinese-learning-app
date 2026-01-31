import { useState, useEffect } from 'react';
import { useExercise } from '../contexts/ExerciseContext';
import type { ExerciseType, PlayMode, AudioExerciseSettings } from '../types/exercise';
import { isAudioExercise } from '../types/exercise';
import type { VocabularyFilterConfig } from '../types/vocabularyFilter';
import type { SpeechRate, ReplayLimit } from '../types/tts';
import { SPEECH_RATE_LABELS, REPLAY_LIMIT_LABELS, DEFAULT_AUDIO_EXERCISE_CONFIG } from '../types/tts';
import { VocabularyFilter } from './VocabularyFilter';
import { countFilteredVocabulary, getFilterForExercise, hasMasteryFilterActive } from '../lib/vocabularyFilter';
import { CharacterSetToggle } from './CharacterSetToggle';
import { loadCharacterSetPreference, saveCharacterSetPreference } from '../lib/characterConverter';
import type { CharacterSet } from '../lib/characterConverter';

const EXERCISE_LABELS: Record<ExerciseType, string> = {
  'character-to-pinyin': 'Character → Pinyin',
  'character-to-english': 'Character → English',
  'english-to-pinyin': 'English → Pinyin',
  'pinyin-to-english': 'Pinyin → English',
  'shuffled': 'Shuffled → Pinyin',
  'shuffled-to-english': 'Shuffled → English',
  'audio-to-pinyin': 'Audio → Pinyin',
  'audio-to-english': 'Audio → English',
  'flashcard': 'Flashcard',
};

const PLAY_MODE_LABELS: Record<PlayMode, string> = {
  'endless': 'Endless Practice',
  'complete-all': 'Complete All',
  'drill': 'Drill Mode',
  'speed-drill': 'Speed Drill',
};

const PLAY_MODE_DESCRIPTIONS: Record<PlayMode, string> = {
  'endless': 'Continuous random prompts until you stop',
  'complete-all': 'Go through each word once, then see your results',
  'drill': 'Repeat each word until answered correctly',
  'speed-drill': 'Focus on improving response speed',
};

export function ExerciseConfigScreen() {
  const { state, dispatch } = useExercise();
  const [filter, setFilter] = useState<VocabularyFilterConfig>({ type: 'all' });
  const [audioSettings, setAudioSettings] = useState<AudioExerciseSettings>({
    speechRate: DEFAULT_AUDIO_EXERCISE_CONFIG.speechRate,
    replayLimit: DEFAULT_AUDIO_EXERCISE_CONFIG.replayLimit,
  });
  const [characterSet, setCharacterSet] = useState<CharacterSet>(loadCharacterSetPreference);

  const handleCharacterSetChange = (value: CharacterSet) => {
    setCharacterSet(value);
    saveCharacterSetPreference(value);
  };

  const pendingConfig = state.pendingExerciseConfig;
  const exerciseType = pendingConfig?.exerciseType || 'character-to-pinyin';
  const playMode = pendingConfig?.playMode || 'endless';
  const isAudio = isAudioExercise(exerciseType);

  const exerciseKey = `${exerciseType}-${playMode}`;
  const vocabulary = state.vocabulary?.active || [];
  const database = state.responseDatabase;

  // Load saved filter on mount
  useEffect(() => {
    const savedFilter = getFilterForExercise(exerciseKey);
    if (savedFilter) {
      setFilter(savedFilter);
    }
  }, [exerciseKey]);

  const filteredCount = countFilteredVocabulary(vocabulary, filter, database);

  const handleStart = () => {
    // Include filter if type is not 'all' OR if mastery filter is active
    const shouldIncludeFilter = filter.type !== 'all' || hasMasteryFilterActive(filter);
    dispatch({
      type: 'START_SESSION_WITH_CONFIG',
      payload: {
        exerciseType,
        playMode,
        vocabularyFilter: shouldIncludeFilter ? filter : undefined,
        audioSettings: isAudio ? audioSettings : undefined,
        characterSet,
      }
    });
  };

  const handleBack = () => {
    dispatch({ type: 'BACK_TO_MENU' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
              {EXERCISE_LABELS[exerciseType]}
            </h1>
            <div className="inline-block bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-4 py-2 rounded-lg">
              <span className="font-semibold">{PLAY_MODE_LABELS[playMode]}</span>
              <span className="text-sm ml-2 opacity-80">— {PLAY_MODE_DESCRIPTIONS[playMode]}</span>
            </div>
          </div>

          {/* Configuration */}
          <div className="space-y-8">
            {/* Vocabulary Filter */}
            <div>
              <VocabularyFilter
                exerciseKey={exerciseKey}
                vocabulary={vocabulary}
                database={database}
                onFilterChange={setFilter}
                showRememberOption={true}
                characterSet={characterSet}
              />
            </div>

            {/* Audio Settings (only for audio exercises) */}
            {isAudio && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-700 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-4 flex items-center gap-2">
                  <span>Audio Settings</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Speech Rate */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Speech Rate
                    </label>
                    <select
                      value={audioSettings.speechRate}
                      onChange={(e) => setAudioSettings(prev => ({
                        ...prev,
                        speechRate: e.target.value as SpeechRate
                      }))}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:border-amber-500 dark:focus:border-amber-400 outline-none"
                    >
                      {(Object.entries(SPEECH_RATE_LABELS) as [SpeechRate, string][]).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Replay Limit */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Replay Limit
                    </label>
                    <select
                      value={audioSettings.replayLimit}
                      onChange={(e) => setAudioSettings(prev => ({
                        ...prev,
                        replayLimit: e.target.value as ReplayLimit
                      }))}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:border-amber-500 dark:focus:border-amber-400 outline-none"
                    >
                      {(Object.entries(REPLAY_LIMIT_LABELS) as [ReplayLimit, string][]).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Character Set (affects feedback screen display and mastery tracking) */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 flex justify-center">
              <CharacterSetToggle value={characterSet} onChange={handleCharacterSetChange} />
            </div>

            {/* Filtered Count */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                  {filteredCount}
                </div>
                <div className="text-gray-600 dark:text-gray-400 mt-1">
                  vocabulary items selected
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {isAudio ? (
                  <>
                    <span className="font-semibold">Audio Exercise:</span> Listen to the Chinese audio and type your answer.
                    Configure TTS settings in the app settings to use Google Cloud TTS for higher quality audio.
                  </>
                ) : (
                  <>
                    <span className="font-semibold">Tip:</span> Use filters to focus your practice on specific vocabulary.
                    Select "Remember my filter" to save your preference for this exercise type.
                  </>
                )}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={handleBack}
                className="flex-1 bg-gray-600 hover:bg-gray-700 dark:bg-gray-600 dark:hover:bg-gray-500 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200"
              >
                ← Back to Menu
              </button>
              <button
                onClick={handleStart}
                disabled={filteredCount === 0}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed"
              >
                {filteredCount === 0 ? 'No Vocabulary Selected' : 'Start Exercise →'}
              </button>
            </div>

            {filteredCount === 0 && (
              <p className="text-center text-sm text-red-600 dark:text-red-400">
                No vocabulary items match this filter. Try a different filter.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
