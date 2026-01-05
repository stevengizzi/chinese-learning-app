import { useEffect } from 'react';
import { ExerciseProvider, useExercise } from './contexts/ExerciseContext';
import { WelcomeScreen } from './components/WelcomeScreen';
import { MainMenu } from './components/MainMenu';
import { ExerciseScreen } from './components/ExerciseScreen';
import { FeedbackScreen } from './components/FeedbackScreen';
import { ReportScreen } from './components/ReportScreen';
import { VocabularyUploader } from './components/VocabularyUploader';

function AppContent() {
  const { state, dispatch } = useExercise();

  useEffect(() => {
    // Try to load vocabulary from localStorage on startup
    const savedVocabulary = localStorage.getItem('vocabulary');
    if (savedVocabulary) {
      try {
        const vocabulary = JSON.parse(savedVocabulary);
        dispatch({ type: 'SET_VOCABULARY', payload: vocabulary });
      } catch (error) {
        console.error('Failed to load saved vocabulary:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load saved vocabulary' });
      }
    } else {
      // No saved vocabulary, stop loading
      dispatch({ type: 'FINISH_LOADING' });
    }
  }, [dispatch]);

  // Show loading state
  if (state.isLoading && !state.vocabulary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-gray-600 text-lg">Loading...</div>
      </div>
    );
  }

  // Show welcome screen if no vocabulary loaded
  if (!state.vocabulary) {
    return <WelcomeScreen />;
  }

  // Render screen based on current state
  return (
    <>
      {state.screen === 'menu' && <MainMenu />}
      {state.screen === 'exercise' && <ExerciseScreen />}
      {state.screen === 'feedback' && <FeedbackScreen />}
      {state.screen === 'report' && <ReportScreen />}

      {/* Floating vocabulary update button - show only on menu and report screens */}
      {(state.screen === 'menu' || state.screen === 'report') && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-white rounded-xl shadow-lg p-3">
            <VocabularyUploader />
          </div>
        </div>
      )}
    </>
  );
}

function App() {
  return (
    <ExerciseProvider>
      <AppContent />
    </ExerciseProvider>
  );
}

export default App;
