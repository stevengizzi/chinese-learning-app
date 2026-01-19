import { useTheme } from '../contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-6 right-6 z-50 w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded-full shadow-lg hover:shadow-xl border-2 border-gray-300 dark:border-gray-600 relative"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {/* Toggle circle - using left positioning for smooth animation */}
      <div
        className="absolute w-6 h-6 bg-white dark:bg-gray-800 rounded-full shadow-md flex items-center justify-center transition-all duration-300 ease-in-out"
        style={{ left: theme === 'dark' ? '34px' : '4px' }}
      >
        <span className={`text-sm ${theme === 'dark' ? 'text-yellow-300' : 'text-orange-500'}`}>
          {theme === 'light' ? '日' : '月'}
        </span>
      </div>
    </button>
  );
}
