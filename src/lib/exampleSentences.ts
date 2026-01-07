export interface ExampleSentence {
  hanzi: string;
  pinyin: string;
  meaning: string;
}

/**
 * Parses the hsk_1.txt file content and returns an array of example sentences
 */
export function parseExampleSentences(content: string): ExampleSentence[] {
  const sentences: ExampleSentence[] = [];

  // Split by "--" separator to get individual sentence blocks
  const blocks = content.split(/\n--\n/).filter(block => block.trim());

  for (const block of blocks) {
    const lines = block.split('\n');
    let english = '';
    let mandarin = '';
    let pinyin = '';

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('english:')) {
        english = trimmedLine.substring('english:'.length).trim();
      } else if (trimmedLine.startsWith('mandarin:')) {
        mandarin = trimmedLine.substring('mandarin:'.length).trim();
      } else if (trimmedLine.startsWith('pinyin:')) {
        pinyin = trimmedLine.substring('pinyin:'.length).trim();
        // Remove trailing period if present
        if (pinyin.endsWith('。')) {
          pinyin = pinyin.slice(0, -1);
        }
      }
    }

    // Only add if all three fields are present
    if (english && mandarin && pinyin) {
      sentences.push({
        hanzi: mandarin,
        pinyin: pinyin,
        meaning: english
      });
    }
  }

  return sentences;
}

/**
 * Finds example sentences that contain the given character(s)
 * Matches based on exact character sequence
 * Deduplicates sentences with identical Hanzi (keeps one random instance)
 */
export function findMatchingSentences(
  sentences: ExampleSentence[],
  targetCharacters: string,
  maxResults: number = 5
): ExampleSentence[] {
  const matching = sentences.filter(sentence =>
    sentence.hanzi.includes(targetCharacters)
  );

  // Group by hanzi to deduplicate
  const hanziGroups = new Map<string, ExampleSentence[]>();
  for (const sentence of matching) {
    if (!hanziGroups.has(sentence.hanzi)) {
      hanziGroups.set(sentence.hanzi, []);
    }
    hanziGroups.get(sentence.hanzi)!.push(sentence);
  }

  // Pick one random sentence from each hanzi group
  const deduplicated: ExampleSentence[] = [];
  for (const group of hanziGroups.values()) {
    const randomIndex = Math.floor(Math.random() * group.length);
    deduplicated.push(group[randomIndex]);
  }

  // If we have more than maxResults, randomly select maxResults
  if (deduplicated.length <= maxResults) {
    return deduplicated;
  }

  // Fisher-Yates shuffle and take first maxResults
  const shuffled = [...deduplicated];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, maxResults);
}
