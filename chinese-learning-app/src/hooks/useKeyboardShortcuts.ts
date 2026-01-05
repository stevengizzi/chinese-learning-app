import { useEffect } from 'react';

export function useKeyboardShortcuts(handlers: {
  onEnter?: () => void;
  onEscape?: () => void;
  onCtrlR?: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Enter key
      if (event.key === 'Enter' && handlers.onEnter) {
        // Only trigger if not typing in an input
        if (!(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)) {
          event.preventDefault();
          handlers.onEnter();
        }
      }

      // Escape key
      if (event.key === 'Escape' && handlers.onEscape) {
        event.preventDefault();
        handlers.onEscape();
      }

      // Ctrl/Cmd + R
      if ((event.ctrlKey || event.metaKey) && event.key === 'r' && handlers.onCtrlR) {
        event.preventDefault();
        handlers.onCtrlR();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}
