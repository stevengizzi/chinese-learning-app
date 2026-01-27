/**
 * Pleco XML Parser
 *
 * Parses vocabulary exports from the Pleco Chinese dictionary app.
 * Handles pinyin normalization and definition extraction.
 */

import type { VocabularyData, VocabularyEntry } from '../types/vocabulary';

/**
 * Valid pinyin initials (longer ones first for matching)
 */
const PINYIN_INITIALS = [
  'zhuang', 'chuang', 'shuang',
  'zhuan', 'chuan', 'shuan', 'zhuai', 'chuai', 'shuai',
  'zhang', 'chang', 'shang', 'zheng', 'cheng', 'sheng',
  'zhong', 'chong',
  'zhua', 'chua', 'shua', 'zhuo', 'chuo', 'shuo',
  'zhai', 'chai', 'shai', 'zhao', 'chao', 'shao',
  'zhan', 'chan', 'shan', 'zhen', 'chen', 'shen',
  'zhou', 'chou', 'shou', 'zhou',
  'zhu', 'chu', 'shu', 'zhi', 'chi', 'shi', 'zhe', 'che', 'she', 'zha', 'cha', 'sha',
  'zh', 'ch', 'sh',
  'guang', 'kuang', 'huang',
  'guan', 'kuan', 'huan', 'guai', 'kuai', 'huai',
  'gang', 'kang', 'hang', 'geng', 'keng', 'heng',
  'gong', 'kong', 'hong',
  'gua', 'kua', 'hua', 'guo', 'kuo', 'huo',
  'gai', 'kai', 'hai', 'gao', 'kao', 'hao',
  'gan', 'kan', 'han', 'gen', 'ken', 'hen',
  'gou', 'kou', 'hou', 'gei', 'kei', 'hei',
  'gu', 'ku', 'hu', 'ge', 'ke', 'he', 'ga', 'ka', 'ha',
  'niang', 'liang',
  'nian', 'lian', 'niao', 'liao',
  'ning', 'ling', 'nong', 'long',
  'niu', 'liu', 'nie', 'lie',
  'nü', 'lü', 'nv', 'lv',
  'nu', 'lu', 'ni', 'li', 'ne', 'le', 'na', 'la',
  'jiong', 'qiong', 'xiong',
  'jiang', 'qiang', 'xiang',
  'jian', 'qian', 'xian', 'jiao', 'qiao', 'xiao',
  'jing', 'qing', 'xing',
  'jiu', 'qiu', 'xiu', 'jie', 'qie', 'xie',
  'jin', 'qin', 'xin',
  'ju', 'qu', 'xu', 'ji', 'qi', 'xi', 'jue', 'que', 'xue', 'jun', 'qun', 'xun',
  'j', 'q', 'x',
  'zuan', 'cuan', 'suan', 'ruan', 'yuan', 'luan', 'nuan', 'guan', 'kuan', 'huan', 'duan', 'tuan',
  'zang', 'cang', 'sang', 'rang', 'yang', 'wang', 'dang', 'tang', 'nang', 'lang', 'bang', 'pang', 'mang', 'fang',
  'zeng', 'ceng', 'seng', 'reng', 'weng', 'deng', 'teng', 'neng', 'leng', 'beng', 'peng', 'meng', 'feng',
  'zong', 'cong', 'song', 'rong', 'yong', 'dong', 'tong', 'nong', 'long', 'bong', 'pong', 'mong', 'fong',
  'zui', 'cui', 'sui', 'rui', 'dui', 'tui', 'gui', 'kui', 'hui',
  'zun', 'cun', 'sun', 'run', 'dun', 'tun', 'gun', 'kun', 'hun', 'lun', 'nun',
  'zuo', 'cuo', 'suo', 'ruo', 'duo', 'tuo', 'nuo', 'luo', 'guo', 'kuo', 'huo', 'buo', 'puo', 'muo', 'fuo', 'wo',
  'zou', 'cou', 'sou', 'rou', 'dou', 'tou', 'nou', 'lou', 'gou', 'kou', 'hou',
  'zan', 'can', 'san', 'ran', 'dan', 'tan', 'nan', 'lan', 'ban', 'pan', 'man', 'fan', 'wan', 'yan', 'an',
  'zen', 'cen', 'sen', 'ren', 'den', 'nen', 'ben', 'pen', 'men', 'fen', 'wen', 'en',
  'zao', 'cao', 'sao', 'rao', 'dao', 'tao', 'nao', 'lao', 'bao', 'pao', 'mao', 'yao', 'ao',
  'zai', 'cai', 'sai', 'dai', 'tai', 'nai', 'lai', 'bai', 'pai', 'mai', 'wai', 'ai',
  'zei', 'dei', 'lei', 'bei', 'pei', 'mei', 'fei', 'wei', 'ei',
  'zia', 'cia', 'sia', 'ria', 'dia', 'tia', 'nia', 'lia', 'bia', 'pia', 'mia', 'ya', 'a',
  'zu', 'cu', 'su', 'ru', 'du', 'tu', 'nu', 'lu', 'bu', 'pu', 'mu', 'fu', 'wu', 'u',
  'zi', 'ci', 'si', 'ri', 'di', 'ti', 'ni', 'li', 'bi', 'pi', 'mi', 'yi', 'i',
  'ze', 'ce', 'se', 're', 'de', 'te', 'ne', 'le', 'be', 'pe', 'me', 'fe', 'ye', 'e',
  'za', 'ca', 'sa', 'da', 'ta', 'na', 'la', 'ba', 'pa', 'ma', 'fa',
  'z', 'c', 's', 'r', 'd', 't', 'n', 'l', 'b', 'p', 'm', 'f', 'g', 'k', 'h', 'w', 'y',
  'ou', 'er', 'o',
];

/**
 * Split concatenated pinyin into space-separated syllables.
 * e.g., "fan4dian4" → "fan4 dian4"
 */
export function splitPinyinSyllables(pinyin: string): string {
  const input = pinyin.toLowerCase().trim();
  const syllables: string[] = [];
  let remaining = input;

  while (remaining.length > 0) {
    let matched = false;

    // Try to match syllable with tone number
    for (const initial of PINYIN_INITIALS) {
      if (remaining.startsWith(initial)) {
        // Check for tone number after the initial/final
        const afterInitial = remaining.slice(initial.length);
        const toneMatch = afterInitial.match(/^([aeiouüv]*(?:ng?|r)?[1-5]?)/i);

        if (toneMatch && toneMatch[0].length > 0) {
          const syllable = initial + toneMatch[0];
          syllables.push(syllable);
          remaining = remaining.slice(syllable.length);
          matched = true;
          break;
        } else if (initial.length > 1) {
          // For multi-char initials that include finals (like "fan"), check for tone
          const toneOnly = afterInitial.match(/^[1-5]/);
          if (toneOnly) {
            syllables.push(initial + toneOnly[0]);
            remaining = remaining.slice(initial.length + 1);
            matched = true;
            break;
          } else if (afterInitial.length === 0 || /^[bcdfghjklmnpqrstwxyz]/.test(afterInitial)) {
            // End of string or next consonant - this syllable is complete
            syllables.push(initial);
            remaining = remaining.slice(initial.length);
            matched = true;
            break;
          }
        }
      }
    }

    // If no match, try simple pattern: consonants + vowels + optional nasal + tone
    if (!matched) {
      const simpleMatch = remaining.match(/^([bcdfghjklmnpqrstwxyz]*[aeiouüv]+(?:ng?|r)?[1-5]?)/i);
      if (simpleMatch) {
        syllables.push(simpleMatch[0]);
        remaining = remaining.slice(simpleMatch[0].length);
        matched = true;
      }
    }

    // Last resort: take one character
    if (!matched) {
      syllables.push(remaining[0]);
      remaining = remaining.slice(1);
    }
  }

  return syllables.join(' ');
}

/**
 * Extract a concise meaning from a verbose Pleco definition.
 * Removes part of speech, examples, and pinyin references.
 */
export function extractCoreMeaning(defn: string): string {
  if (!defn) return '';

  let meaning = defn;

  // Remove part of speech prefix
  meaning = meaning.replace(/^(noun|verb|adjective|adverb|measure word|pronoun|conjunction|preposition|particle|interjection|numeral|prefix|suffix|auxiliary|onomatopoeia|idiom|dialect|colloquial|literary|formal|informal|derogatory|abbreviation)\s*/gi, '');

  // If there are numbered definitions (1, 2, 3...), take just the first one
  const numberedMatch = meaning.match(/^1\s+([^2]+?)(?:\s+2\s+|$)/);
  if (numberedMatch) {
    meaning = numberedMatch[1];
  }

  // Remove Chinese characters and pinyin examples (patterns like: 北京饭店 Běijīng fàndiàn)
  meaning = meaning.replace(/[\u4e00-\u9fff]+\s*[a-züA-ZÜ][a-züA-ZÜ\s]*(?:[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ][a-züA-ZÜ]*)+/g, '');

  // Remove standalone pinyin with tone marks
  meaning = meaning.replace(/\b[a-züA-ZÜ]*[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ][a-züA-ZÜ]*(?:\s+[a-züA-ZÜ]*[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ][a-züA-ZÜ]*)*\b/g, '');

  // Remove pinyin with tone numbers
  meaning = meaning.replace(/\b[a-züA-ZÜ]+[1-5](?:\s+[a-züA-ZÜ]+[1-5])*\b/g, '');

  // Remove Chinese characters
  meaning = meaning.replace(/[\u4e00-\u9fff]+/g, '');

  // Clean up extra whitespace and punctuation
  meaning = meaning.replace(/\s+/g, ' ');
  meaning = meaning.replace(/^\s*[;,.\s]+/, '');
  meaning = meaning.replace(/[;,.\s]+\s*$/, '');
  meaning = meaning.trim();

  // Truncate at reasonable length
  if (meaning.length > 100) {
    // Try to cut at a word boundary
    const truncated = meaning.substring(0, 100);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 60) {
      meaning = truncated.substring(0, lastSpace) + '...';
    } else {
      meaning = truncated + '...';
    }
  }

  return meaning || defn.substring(0, 50); // Fallback to first 50 chars if extraction failed
}

/**
 * Parse Pleco XML export into VocabularyData.
 */
export function parsePlecoXml(xmlContent: string): VocabularyData {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, 'text/xml');

  // Check for parsing errors
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid XML format: ' + parseError.textContent);
  }

  const cards = doc.querySelectorAll('card');
  const entries: VocabularyEntry[] = [];

  cards.forEach((card) => {
    const entry = card.querySelector('entry');
    if (!entry) return;

    // Get simplified Chinese headword (prefer sc, fall back to first headword)
    const headwords = entry.querySelectorAll('headword');
    let word = '';
    for (const hw of headwords) {
      if (hw.getAttribute('charset') === 'sc') {
        word = hw.textContent?.trim() || '';
        break;
      }
    }
    if (!word && headwords.length > 0) {
      word = headwords[0].textContent?.trim() || '';
    }

    // Get pinyin
    const pronEl = entry.querySelector('pron[type="hypy"]');
    let pinyin = pronEl?.textContent?.trim() || '';

    // Split concatenated pinyin into syllables
    if (pinyin) {
      pinyin = splitPinyinSyllables(pinyin);
    }

    // Get definition
    const defnEl = entry.querySelector('defn');
    const originalMeaning = defnEl?.textContent?.trim() || '';
    const meaning = extractCoreMeaning(originalMeaning);

    // Only add if we have required fields
    if (word && pinyin && meaning) {
      entries.push({
        word,
        pinyin,
        meaning,
        originalMeaning: originalMeaning !== meaning ? originalMeaning : undefined,
      });
    }
  });

  if (entries.length === 0) {
    throw new Error('No valid vocabulary entries found in the Pleco export');
  }

  return {
    active: entries,
    metadata: {
      version: '1.0',
      lastUpdated: new Date().toISOString().split('T')[0],
      source: 'pleco',
    },
  };
}
