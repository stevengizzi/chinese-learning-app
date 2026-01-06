import { useTheme } from '../contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-6 right-6 z-50 bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-200 dark:border-gray-600"
      aria-label="Toggle theme"
    >
      <span className="text-2xl transition-opacity duration-300">
        {theme === 'light' ? '日' : '月'}
      </span>
    </button>
  );
}
