import { useTheme } from '../contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="fixed right-6 z-50 bg-gray-200 dark:bg-gray-700 rounded-full p-1 shadow-lg hover:shadow-xl border-2 border-gray-300 dark:border-gray-600 flex items-center"
      style={{ top: '1.5rem', width: '64px', height: '32px' }}
      aria-label="Toggle theme"
    >
      {/* Toggle circle */}
      <div
        className={`w-6 h-6 bg-white dark:bg-gray-900 rounded-full shadow-md flex items-center justify-center`}
        style={{
          transform: theme === 'dark' ? 'translateX(32px)' : 'translateX(0)',
          transition: 'transform 300ms ease-in-out'
        }}
      >
        <span className="text-sm">
          {theme === 'light' ? '日' : '月'}
        </span>
      </div>
    </button>
  );
}
