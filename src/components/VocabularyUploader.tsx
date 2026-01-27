import { useRef } from 'react';
import type { ChangeEvent } from 'react';
import { parseVocabularyMarkdown } from '../lib/vocabularyParser';
import { parsePlecoXml } from '../lib/plecoXmlParser';
import { useExercise } from '../contexts/ExerciseContext';
import type { VocabularyData } from '../types/vocabulary';

interface VocabularyUploaderProps {
  buttonText?: string;
  buttonClassName?: string;
}

export function VocabularyUploader({
  buttonText = 'Upload Vocabulary',
  buttonClassName = 'w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200',
}: VocabularyUploaderProps) {
  const { dispatch } = useExercise();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const extension = file.name.split('.').pop()?.toLowerCase();

      let vocabularyData: VocabularyData;

      if (extension === 'xml') {
        vocabularyData = parsePlecoXml(text);
      } else {
        vocabularyData = parseVocabularyMarkdown(text);
      }

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
        accept=".md,.markdown,.xml"
        onChange={handleFileSelect}
        className="hidden"
      />
      <button
        onClick={handleClick}
        className={buttonClassName}
      >
        {buttonText}
      </button>
    </div>
  );
}
