import type { VocabularyData, VocabularyEntry } from '../types/vocabulary';

export function parseVocabularyMarkdown(content: string): VocabularyData {
  const lines = content.split('\n');
  const active: VocabularyEntry[] = [];

  let version = '0.1';
  // Always set lastUpdated to the current date
  const lastUpdated = new Date().toISOString().split('T')[0];

  // Extract metadata from frontmatter
  let inFrontmatter = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line === '---') {
      inFrontmatter = !inFrontmatter;
      continue;
    }

    if (inFrontmatter) {
      if (line.startsWith('version:')) {
        version = line.split(':')[1].trim();
      }
      // Ignore last_updated from file, always use current date
    }
  }

  // Find Active Vocabulary section
  let inActiveSection = false;
  let foundTableHeader = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Check if we're entering the Active Vocabulary section
    if (trimmed === '## Active Vocabulary') {
      inActiveSection = true;
      continue;
    }

    // Check if we're leaving the section (new ## heading)
    if (inActiveSection && trimmed.startsWith('##') && trimmed !== '## Active Vocabulary') {
      break;
    }

    if (inActiveSection) {
      // Skip table header and separator
      if (trimmed.startsWith('| Word') || trimmed.startsWith('| -')) {
        foundTableHeader = true;
        continue;
      }

      // Parse table rows
      if (foundTableHeader && trimmed.startsWith('|')) {
        const parts = trimmed
          .split('|')
          .map(p => p.trim())
          .filter(p => p.length > 0);

        if (parts.length >= 3) {
          const [word, pinyin, meaning] = parts;

          // Validate entry
          if (word && pinyin && meaning) {
            active.push({
              word,
              pinyin,
              meaning
            });
          }
        }
      }
    }
  }

  return {
    active,
    metadata: {
      version,
      lastUpdated,
      source: 'markdown',
    }
  };
}
