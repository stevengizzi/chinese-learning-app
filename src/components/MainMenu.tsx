import { useState, useEffect } from 'react';
import { useExercise } from '../contexts/ExerciseContext';
import type { ExerciseType, PlayMode } from '../types/exercise';
import { VocabularyUploader } from './VocabularyUploader';
import { getAllHighScores, formatTime, formatDate } from '../lib/highScores';

export function MainMenu() {
  const { state, dispatch } = useExercise();
  const [highScores, setHighScores] = useState(getAllHighScores());

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
      // Start other play modes directly
      dispatch({
        type: 'START_SESSION_WITH_CONFIG',
        payload: { exerciseType, playMode }
      });
    }
  };

  const handleViewVocabulary = () => {
    dispatch({ type: 'VIEW_VOCABULARY' });
  };

  const getHighScoreForMode = (exerciseType: ExerciseType, playMode: PlayMode) => {
    const key = `${exerciseType}-${playMode}`;
    return highScores[key];
  };

  const exercises = [
    {
      type: 'character-to-pinyin' as ExerciseType,
      title: 'Character → Pinyin',
      description: 'View Chinese characters and type their pinyin with tone numbers',
      icon: '字'
    },
    {
      type: 'english-to-pinyin' as ExerciseType,
      title: 'English → Pinyin',
      description: 'View English meanings and type their pinyin with tone numbers',
      icon: '📖'
    },
    {
      type: 'shuffled' as ExerciseType,
      title: 'Shuffled (Characters & English) → Pinyin',
      description: 'Random mix of Chinese characters and English meanings',
      icon: '🔀'
    },
    {
      type: 'character-to-english' as ExerciseType,
      title: 'Character → English',
      description: 'View Chinese characters and type their English meanings',
      icon: '字'
    },
    {
      type: 'pinyin-to-english' as ExerciseType,
      title: 'Pinyin → English',
      description: 'View pinyin and type their English meanings',
      icon: '🔤'
    },
    {
      type: 'shuffled-to-english' as ExerciseType,
      title: 'Shuffled (Characters & Pinyin) → English',
      description: 'Random mix of Chinese characters and pinyin',
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
            <div className="mb-8 flex justify-center gap-4">
              <button
                onClick={handleViewVocabulary}
                className="bg-gray-600 hover:bg-gray-700 dark:bg-gray-600 dark:hover:bg-gray-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                📋 View Vocabulary
              </button>
              <VocabularyUploader />
            </div>

            {/* Tone Sequence Trainer Button */}
            <div className="mb-8">
              <button
                onClick={() => dispatch({ type: 'START_TONE_SEQUENCE' })}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <span className="text-2xl mr-2">🎵</span>
                <span className="text-lg">Tone Sequence Trainer</span>
              </button>
              <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
                Practice tone pronunciation with random syllable sequences
              </p>
            </div>

            {/* Exercise Types */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Exercise Types</h2>
              <div className="grid grid-cols-1 gap-4">
              {exercises.map((exercise) => (
                <div
                  key={exercise.type}
                  className="bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl p-6 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                >
                  <div className="text-4xl mb-3 text-center">{exercise.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 text-center">
                    {exercise.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm text-center mb-4">
                    {exercise.description}
                  </p>

                  {/* Play Mode Buttons */}
                  <div className="space-y-2">
                    {playModes.map((playMode) => {
                      const highScore = getHighScoreForMode(exercise.type, playMode.mode);
                      return (
                        <div key={playMode.mode}>
                          <button
                            onClick={() => handleStartExercise(exercise.type, playMode.mode)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 text-sm my-1"
                          >
                            {playMode.name}
                          </button>
                          {highScore && (
                            <div className="text-xs text-gray-600 dark:text-gray-400 text-center mt-1 mb-2">
                              <span className="font-semibold">🏆 Best Average: </span>
                              {formatTime(highScore.averageTimePerCorrectAnswer)}
                              <span className="text-gray-500 dark:text-gray-500 ml-1">
                                ({formatDate(highScore.date)})
                              </span>
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
    </div>
  );
}
