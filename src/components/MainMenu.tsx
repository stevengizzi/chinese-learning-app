import { useState, useEffect } from 'react';
import { useExercise } from '../contexts/ExerciseContext';
import type { ExerciseType, PlayMode } from '../types/exercise';
import type { VocabularyFilterConfig } from '../types/vocabularyFilter';
import { VocabularyUploader } from './VocabularyUploader';
import { getAllHighScores, formatTime } from '../lib/highScores';
import { TrainingModeToggle } from './TrainingModeToggle';
import { ExerciseConfigPanel } from './ExerciseConfigPanel';

export function MainMenu() {
  const { state, dispatch } = useExercise();
  const [highScores, setHighScores] = useState(getAllHighScores());
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [pendingExercise, setPendingExercise] = useState<{ type: ExerciseType; mode: PlayMode } | null>(null);

  // Reload high scores when component mounts or when returning from a session
  useEffect(() => {
    const reloadHighScores = () => {
      setHighScores(getAllHighScores());
    };

    // Reload immediately
    reloadHighScores();

    // Set up interval to check for updates (in case of multiple tabs)
    const interval = setInterval(reloadHighScores, 1000);

    // Listen for storage events from other tabs
    window.addEventListener('storage', reloadHighScores);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', reloadHighScores);
    };
  }, [state.screen]); // Reload when screen changes (e.g., returning from report)

  const handleStartExercise = (exerciseType: ExerciseType, playMode: PlayMode) => {
    if (playMode === 'speed-drill') {
      // Show config screen for speed drill
      dispatch({
        type: 'SHOW_SPEED_DRILL_CONFIG',
        payload: { exerciseType }
      });
    } else {
      // Show config panel for filter selection
      setPendingExercise({ type: exerciseType, mode: playMode });
      setShowConfigPanel(true);
    }
  };

  const handleConfigStart = (filter?: VocabularyFilterConfig) => {
    if (!pendingExercise) return;

    dispatch({
      type: 'START_SESSION_WITH_CONFIG',
      payload: {
        exerciseType: pendingExercise.type,
        playMode: pendingExercise.mode,
        vocabularyFilter: filter
      }
    });

    setShowConfigPanel(false);
    setPendingExercise(null);
  };

  const handleConfigCancel = () => {
    setShowConfigPanel(false);
    setPendingExercise(null);
  };

  const handleViewVocabulary = () => {
    dispatch({ type: 'VIEW_VOCABULARY' });
  };

  const getHighScoreForMode = (exerciseType: ExerciseType, playMode: PlayMode) => {
    const key = `${exerciseType}-${playMode}`;
    return highScores[key];
  };

  // Exercises grouped by answer type
  const pinyinExercises = [
    {
      type: 'character-to-pinyin' as ExerciseType,
      title: 'Character → Pinyin',
      shortTitle: '字 → 拼音',
      icon: '字'
    },
    {
      type: 'english-to-pinyin' as ExerciseType,
      title: 'English → Pinyin',
      shortTitle: 'EN → 拼音',
      icon: '📖'
    },
    {
      type: 'shuffled' as ExerciseType,
      title: 'Shuffled → Pinyin',
      shortTitle: '🔀 → 拼音',
      icon: '🔀'
    }
  ];

  const englishExercises = [
    {
      type: 'character-to-english' as ExerciseType,
      title: 'Character → English',
      shortTitle: '字 → EN',
      icon: '字'
    },
    {
      type: 'pinyin-to-english' as ExerciseType,
      title: 'Pinyin → English',
      shortTitle: '拼音 → EN',
      icon: '🔤'
    },
    {
      type: 'shuffled-to-english' as ExerciseType,
      title: 'Shuffled → English',
      shortTitle: '🔀 → EN',
      icon: '🔀'
    }
  ];

  const playModes: { mode: PlayMode; name: string; description: string }[] = [
    {
      mode: 'endless',
      name: 'Endless Practice',
      description: 'Continuous random prompts'
    },
    {
      mode: 'complete-all',
      name: 'Complete All',
      description: 'Each word once, then session ends'
    },
    {
      mode: 'drill',
      name: 'Drill Mode',
      description: 'Repeat each word until answered correctly'
    },
    {
      mode: 'speed-drill',
      name: 'Speed Drill ⚡',
      description: 'Focus on improving response speed for slower vocabulary'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3">
              Mandarin Pinyin Practice
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Choose an exercise type and play mode
            </p>
          </div>

          {/* Centered Content Container */}
          <div className="max-w-2xl mx-auto">
            {/* Vocabulary Info */}
            {state.vocabulary && (
              <div className="mb-8 bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-4">
                <p className="text-center text-sm text-blue-800 dark:text-blue-200">
                  <span className="font-semibold">Active vocabulary:</span> {state.vocabulary.active.length} words
                  {state.vocabulary.metadata.lastUpdated && (
                    <span className="ml-2">
                      • Updated: {state.vocabulary.metadata.lastUpdated}
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* View Vocabulary & Update Buttons */}
            <div className="mb-4 flex justify-center gap-4">
              <button
                onClick={handleViewVocabulary}
                className="bg-gray-600 hover:bg-gray-700 dark:bg-gray-600 dark:hover:bg-gray-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                📋 View Vocabulary
              </button>
              <VocabularyUploader />
            </div>

            {/* Focus on Weaknesses Toggle */}
            {state.vocabulary && (
              <div className="mb-8">
                <TrainingModeToggle
                  enabled={state.focusOnWeaknesses}
                  onChange={(enabled) => dispatch({ type: 'SET_FOCUS_MODE', payload: enabled })}
                  vocabulary={state.vocabulary.active}
                  database={state.responseDatabase}
                />
              </div>
            )}

            {/* Tone Training Section */}
            <div className="mb-4 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-700 rounded-xl p-4">
              <h2 className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-3 text-center">
                Tone Training
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <button
                    onClick={() => dispatch({ type: 'START_TONE_SEQUENCE' })}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <span className="text-xl mr-2">🎵</span>
                    <span>Tone Sequence</span>
                  </button>
                  <p className="text-center text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Random syllable sequences
                  </p>
                </div>
                <div>
                  <button
                    onClick={() => dispatch({ type: 'START_TONE_PATTERN' })}
                    className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <span className="text-xl mr-2">🎯</span>
                    <span>Tone Pattern</span>
                  </button>
                  <p className="text-center text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Practice specific tone patterns
                  </p>
                </div>
              </div>
            </div>

            {/* Character Recognition Section */}
            <div className="mb-4 bg-cyan-50 dark:bg-cyan-900/20 border-2 border-cyan-200 dark:border-cyan-700 rounded-xl p-4">
              <h2 className="text-lg font-bold text-cyan-900 dark:text-cyan-100 mb-3 text-center">
                Character Recognition
              </h2>
              <div>
                <button
                  onClick={() => dispatch({ type: 'START_SIMILAR_CHARACTERS' })}
                  className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <span className="text-xl mr-2">👁️</span>
                  <span>Similar Characters</span>
                </button>
                <p className="text-center text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Distinguish visually similar characters
                </p>
              </div>
            </div>

            {/* Sentence Reading Button */}
            <div className="mb-8">
              <button
                onClick={() => dispatch({ type: 'START_SENTENCE_READING' })}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <span className="text-2xl mr-2">📖</span>
                <span className="text-lg">Sentence Reading</span>
              </button>
              <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
                Practice reading and translating complete sentences
              </p>
            </div>

            {/* Exercise Types - Pinyin Answers */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Pinyin Answers</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {pinyinExercises.map((exercise) => (
                  <div
                    key={exercise.type}
                    className="bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl p-4 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                  >
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3 text-center">
                      {exercise.shortTitle}
                    </h3>
                    <div className="space-y-1">
                      {playModes.map((playMode) => {
                        const highScore = getHighScoreForMode(exercise.type, playMode.mode);
                        return (
                          <div key={playMode.mode}>
                            <button
                              onClick={() => handleStartExercise(exercise.type, playMode.mode)}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-lg transition-colors duration-200 text-xs"
                            >
                              {playMode.name}
                            </button>
                            {highScore && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-0.5 mb-1">
                                🏆 {formatTime(highScore.averageTimePerCorrectAnswer)}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Exercise Types - English Answers */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">English Answers</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {englishExercises.map((exercise) => (
                  <div
                    key={exercise.type}
                    className="bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl p-4 hover:border-green-400 dark:hover:border-green-500 transition-colors"
                  >
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3 text-center">
                      {exercise.shortTitle}
                    </h3>
                    <div className="space-y-1">
                      {playModes.map((playMode) => {
                        const highScore = getHighScoreForMode(exercise.type, playMode.mode);
                        return (
                          <div key={playMode.mode}>
                            <button
                              onClick={() => handleStartExercise(exercise.type, playMode.mode)}
                              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-3 rounded-lg transition-colors duration-200 text-xs"
                            >
                              {playMode.name}
                            </button>
                            {highScore && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-0.5 mb-1">
                                🏆 {formatTime(highScore.averageTimePerCorrectAnswer)}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Play Mode Info */}
            <div className="bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Play Modes</h3>
              <div className="space-y-2 pl-3">
                {playModes.map((playMode) => (
                  <div key={playMode.mode} className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 font-bold mt-1">•</span>
                    <div>
                      <span className="font-bold text-gray-900 dark:text-white">{playMode.name}</span>
                      <span className="text-gray-900 dark:text-white">: </span>
                      <span className="text-gray-600 dark:text-gray-300">{playMode.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exercise Config Panel */}
      {showConfigPanel && pendingExercise && (
        <ExerciseConfigPanel
          exerciseType={pendingExercise.type}
          playMode={pendingExercise.mode}
          onStart={handleConfigStart}
          onCancel={handleConfigCancel}
        />
      )}
    </div>
  );
}
