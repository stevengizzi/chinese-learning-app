import { useEffect } from 'react';
import { ExerciseProvider, useExercise } from './contexts/ExerciseContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { WelcomeScreen } from './components/WelcomeScreen';
import { MainMenu } from './components/MainMenu';
import { ExerciseScreen } from './components/ExerciseScreen';
import { FeedbackScreen } from './components/FeedbackScreen';
import { ReportScreen } from './components/ReportScreen';
import { ViewVocabulary } from './components/ViewVocabulary';
import { ThemeToggle } from './components/ThemeToggle';
import { ToneSequenceTrainer } from './components/ToneSequenceTrainer';
import { SpeedDrillConfig } from './components/SpeedDrillConfig';
import { SentenceReadingTrainer } from './components/SentenceReadingTrainer';
import { TonePatternTrainer } from './components/TonePatternTrainer';

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
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
          <div className="text-gray-600 dark:text-gray-300 text-lg" role="status">Loading vocabulary...</div>
        </div>
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
          {state.screen === 'sentence-reading' && (
            <SentenceReadingTrainer onBack={() => dispatch({ type: 'BACK_TO_MENU' })} />
          )}
          {state.screen === 'tone-pattern' && (
            <TonePatternTrainer onBack={() => dispatch({ type: 'BACK_TO_MENU' })} />
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
