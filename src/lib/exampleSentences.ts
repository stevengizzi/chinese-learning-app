export interface ExampleSentence {
  hanzi: string;
  pinyin: string;
  meaning: string;
}

/**
 * Parses the example_sentences.md file content and returns an array of example sentences
 */
export function parseExampleSentences(markdownContent: string): ExampleSentence[] {
  const lines = markdownContent.split('\n');
  const sentences: ExampleSentence[] = [];

  for (const line of lines) {
    // Skip header lines and empty lines
    if (line.startsWith('|') && !line.includes('---') && !line.includes('Hanzi')) {
      // Parse table row: | Hanzi | Pinyin | Meaning |
      const parts = line.split('|').map(p => p.trim()).filter(p => p.length > 0);

      if (parts.length === 3) {
        sentences.push({
          hanzi: parts[0],
          pinyin: parts[1],
          meaning: parts[2]
        });
      }
    }
  }

  return sentences;
}

/**
 * Finds example sentences that contain the given character(s)
 * Matches based on exact character sequence
 */
export function findMatchingSentences(
  sentences: ExampleSentence[],
  targetCharacters: string,
  maxResults: number = 10
): ExampleSentence[] {
  const matching = sentences.filter(sentence =>
    sentence.hanzi.includes(targetCharacters)
  );

  // If we have more than maxResults, randomly select maxResults
  if (matching.length <= maxResults) {
    return matching;
  }

  // Fisher-Yates shuffle and take first maxResults
  const shuffled = [...matching];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, maxResults);
}
