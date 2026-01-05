export interface VocabularyEntry {
  word: string;        // Chinese characters
  pinyin: string;      // Tone-number pinyin (e.g., "ming2 bai2")
  meaning: string;     // English gloss
}

export interface VocabularyData {
  active: VocabularyEntry[];
  metadata: {
    version: string;
    lastUpdated: string;
  };
}
