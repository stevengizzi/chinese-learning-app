export interface VocabularyEntry {
  word: string;           // Chinese characters
  pinyin: string;         // Tone-number pinyin (e.g., "ming2 bai2")
  meaning: string;        // English gloss (may be user-edited)
  originalMeaning?: string; // Original definition from import (e.g., verbose Pleco def)
  isEdited?: boolean;     // True if user has customized the meaning
}

export interface VocabularyData {
  active: VocabularyEntry[];
  metadata: {
    version: string;
    lastUpdated: string;
    source?: 'markdown' | 'pleco' | 'hsk';  // Where the vocabulary came from
  };
}
