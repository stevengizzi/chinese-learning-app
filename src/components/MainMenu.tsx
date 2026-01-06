import { useExercise } from '../contexts/ExerciseContext';
import type { ExerciseType, PlayMode } from '../types/exercise';
import { VocabularyUploader } from './VocabularyUploader';

export function MainMenu() {
  const { state, dispatch } = useExercise();

  const handleStartExercise = (exerciseType: ExerciseType, playMode: PlayMode) => {
    dispatch({
      type: 'START_SESSION_WITH_CONFIG',
      payload: { exerciseType, playMode }
    });
  };

  const exercises = [
    {
      type: 'character-to-pinyin' as ExerciseType,
      title: 'Character → Pinyin',
      description: 'View Chinese characters and type their pinyin with tone numbers',
      icon: '字'
    },
    {
      type: 'meaning-to-pinyin' as ExerciseType,
      title: 'Meaning → Pinyin',
      description: 'View English meanings and type their pinyin with tone numbers',
      icon: '📖'
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
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
              Mandarin Pinyin Practice
            </h1>
            <p className="text-gray-600 text-lg">
              Choose an exercise type and play mode
            </p>
          </div>

          {/* Vocabulary Info */}
          {state.vocabulary && (
            <div className="mb-8 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <p className="text-center text-sm text-blue-800">
                <span className="font-semibold">Active vocabulary:</span> {state.vocabulary.active.length} words
                {state.vocabulary.metadata.lastUpdated && (
                  <span className="ml-2">
                    • Updated: {state.vocabulary.metadata.lastUpdated}
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Update Vocabulary Button */}
          <div className="mb-8">
            <VocabularyUploader />
          </div>

          {/* Exercise Types */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Exercise Types</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exercises.map((exercise) => (
                <div
                  key={exercise.type}
                  className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 hover:border-blue-400 transition-colors"
                >
                  <div className="text-4xl mb-3 text-center">{exercise.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
                    {exercise.title}
                  </h3>
                  <p className="text-gray-600 text-sm text-center mb-4">
                    {exercise.description}
                  </p>

                  {/* Play Mode Buttons */}
                  <div className="space-y-2">
                    {playModes.map((playMode) => (
                      <button
                        key={playMode.mode}
                        onClick={() => handleStartExercise(exercise.type, playMode.mode)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 text-sm"
                      >
                        {playMode.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Play Mode Info */}
          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Play Modes</h3>
            <div className="space-y-2">
              {playModes.map((playMode) => (
                <div key={playMode.mode} className="flex items-start gap-3">
                  <span className="text-blue-600 font-bold mt-1">•</span>
                  <div>
                    <span className="font-semibold text-gray-900">{playMode.name}:</span>
                    <span className="text-gray-600 ml-2">{playMode.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
