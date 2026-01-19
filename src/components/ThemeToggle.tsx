import { useTheme } from '../contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-6 right-6 z-50 w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded-full shadow-lg hover:shadow-xl border-2 border-gray-300 dark:border-gray-600"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {/* Toggle track with sliding circle */}
      <div className="relative w-full h-full">
        <div
          className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-gray-800 rounded-full shadow-md flex items-center justify-center transition-[left] duration-300 ease-in-out"
          style={{ left: theme === 'dark' ? 'calc(100% - 26px)' : '2px' }}
        >
          <span className={`text-sm ${theme === 'dark' ? 'text-yellow-300' : 'text-orange-500'}`}>
            {theme === 'light' ? '日' : '月'}
          </span>
        </div>
      </div>
    </button>
  );
}
