import { useEffect } from 'react';
import { ExerciseProvider, useExercise } from './contexts/ExerciseContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { WelcomeScreen } from './components/WelcomeScreen';
import { MainMenu } from './components/MainMenu';
import { ExerciseScreen } from './components/ExerciseScreen';
import { FeedbackScreen } from './components/FeedbackScreen';
import { ReportScreen } from './components/ReportScreen';
import { ViewVocabulary } from './components/ViewVocabulary';
import { VocabularyUploader } from './components/VocabularyUploader';
import { ThemeToggle } from './components/ThemeToggle';
import { ToneSequenceTrainer } from './components/ToneSequenceTrainer';
import { SpeedDrillConfig } from './components/SpeedDrillConfig';

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-300 text-lg">Loading...</div>
      </div>
    );
  }

  // Render screen based on current state
  return (
    <>
      <ThemeToggle />

      {/* Show welcome screen if no vocabulary loaded */}
      {!state.vocabulary ? (
        <WelcomeScreen />
      ) : (
        <>
          {state.screen === 'menu' && <MainMenu />}
          {state.screen === 'exercise' && <ExerciseScreen />}
          {state.screen === 'feedback' && <FeedbackScreen />}
          {state.screen === 'report' && <ReportScreen />}
          {state.screen === 'view-vocabulary' && <ViewVocabulary />}
          {state.screen === 'speed-drill-config' && <SpeedDrillConfig />}
          {state.screen === 'tone-sequence' && (
            <ToneSequenceTrainer onBack={() => dispatch({ type: 'BACK_TO_MENU' })} />
          )}

          {/* Floating vocabulary update button - show only on menu and report screens */}
          {(state.screen === 'menu' || state.screen === 'report') && (
            <div className="fixed bottom-6 right-6 z-50">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3">
                <VocabularyUploader />
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ExerciseProvider>
        <AppContent />
      </ExerciseProvider>
    </ThemeProvider>
  );
}

export default App;
