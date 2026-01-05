import { useRef } from 'react';
import type { ChangeEvent } from 'react';
import { parseVocabularyMarkdown } from '../lib/vocabularyParser';
import { useExercise } from '../contexts/ExerciseContext';

export function VocabularyUploader() {
  const { dispatch } = useExercise();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const vocabularyData = parseVocabularyMarkdown(text);

      if (vocabularyData.active.length === 0) {
        throw new Error('No active vocabulary found in file');
      }

      dispatch({ type: 'SET_VOCABULARY', payload: vocabularyData });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to parse vocabulary file';
      dispatch({ type: 'SET_ERROR', payload: message });
      alert(`Error: ${message}`);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown"
        onChange={handleFileSelect}
        className="hidden"
      />
      <button
        onClick={handleClick}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
      >
        📁 Update Vocabulary
      </button>
    </div>
  );
}
