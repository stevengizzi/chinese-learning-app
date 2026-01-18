import { useTheme } from '../contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-6 right-6 z-50 w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded-full p-1 shadow-lg hover:shadow-xl border-2 border-gray-300 dark:border-gray-600 flex items-center"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {/* Toggle circle */}
      <div
        className={`w-6 h-6 bg-white dark:bg-gray-800 rounded-full shadow-md flex items-center justify-center transition-transform duration-300 ease-in-out ${
          theme === 'dark' ? 'translate-x-8' : 'translate-x-0'
        }`}
      >
        <span className={`text-sm ${theme === 'dark' ? 'text-yellow-300' : 'text-orange-500'}`}>
          {theme === 'light' ? '日' : '月'}
        </span>
      </div>
    </button>
  );
}
