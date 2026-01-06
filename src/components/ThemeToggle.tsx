import { useTheme } from '../contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-6 right-6 z-50 bg-gray-200 dark:bg-gray-700 rounded-full p-1 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-300 dark:border-gray-600 w-16 h-8 flex items-center"
      aria-label="Toggle theme"
    >
      {/* Toggle track */}
      <div className="relative w-full h-full flex items-center">
        {/* Toggle circle */}
        <div
          className={`absolute w-6 h-6 bg-white dark:bg-gray-900 rounded-full shadow-md transition-transform duration-300 flex items-center justify-center ${
            theme === 'dark' ? 'transform translate-x-8' : 'transform translate-x-0'
          }`}
        >
          <span className="text-sm">
            {theme === 'light' ? '日' : '月'}
          </span>
        </div>
      </div>
    </button>
  );
}
