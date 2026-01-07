// Script to convert example_sentences.tsv to Markdown table with Hanzi, Pinyin, and English columns
// Usage: npx ts-node scripts/tsv_to_markdown.ts


const fs = require('fs');
const path = require('path');
const pinyin = require('pinyin');

const tsvPath = path.join(__dirname, '../docs/example_sentences.tsv');
const mdPath = path.join(__dirname, '../docs/example_sentences.md');

const tsv = fs.readFileSync(tsvPath, 'utf8');
const lines = tsv.split(/\r?\n/);

// Map to deduplicate by Hanzi + English
const seen = new Map<string, string>();

for (const line of lines) {
  if (!line.trim()) continue;
  const parts = line.split('\t');
  if (parts.length < 4) continue;
  const hanzi = parts[1].trim();
  const english = parts[3].trim();
  const key = hanzi + '\t' + english;
  if (!seen.has(key)) {
    seen.set(key, '');
  }
}

const rows: string[] = [];
for (const key of seen.keys()) {
  const [hanzi, english] = key.split('\t');
  // Generate pinyin with tone marks
  const pinyinArr = pinyin(hanzi, { style: pinyin.STYLE_TONE2 });
  const numbered = pinyinArr.map(sylls => sylls[0]).join(' ');
  rows.push(`| ${hanzi} | ${numbered} | ${english} |`);
}

const header = `| Hanzi | Pinyin | Meaning (English) |\n|-------|--------|-------------------|`;
const output = [header, ...rows].join('\n');

fs.writeFileSync(mdPath, output, 'utf8');
console.log('Markdown table written to', mdPath);
