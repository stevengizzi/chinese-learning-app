import type { Syllable } from '../../types/toneSequence';

/**
 * Mandarin Pinyin Syllable Inventory with Phonetic Difficulty Ratings
 *
 * Difficulty Scoring Heuristic (1-5 scale):
 *
 * Base score: 1
 *
 * Add +1 for each:
 * - Retroflex initials (zh, ch, sh, r) - require tongue curling
 * - Alveolo-palatal initials (j, q, x) - require precise tongue placement
 * - High front vowels in constrained contexts (ü, -i after zh/ch/sh/r/z/c/s)
 * - Complex finals with multiple vowel/glide transitions (iang, iong, uang, etc.)
 *
 * Add +0.5 for each:
 * - Nasal finals (-n, -ng) - require proper nasal resonance
 * - Rounded vowels (o, u) in certain combinations
 * - Erhua (r-coloring, if included)
 *
 * Maximum score capped at 5 for very challenging combinations.
 *
 * This heuristic can be easily modified by adjusting the syllable array below.
 */

export const SYLLABLE_INVENTORY: Syllable[] = [
  // ===== Difficulty 1: Simple, common syllables =====
  // Single vowels or simple CV structure
  { pinyin: 'a', difficulty: 1 },
  { pinyin: 'o', difficulty: 1 },
  { pinyin: 'e', difficulty: 1 },
  { pinyin: 'yi', difficulty: 1 },
  { pinyin: 'wu', difficulty: 1 },
  { pinyin: 'yu', difficulty: 1 },
  { pinyin: 'ba', difficulty: 1 },
  { pinyin: 'pa', difficulty: 1 },
  { pinyin: 'ma', difficulty: 1 },
  { pinyin: 'fa', difficulty: 1 },
  { pinyin: 'da', difficulty: 1 },
  { pinyin: 'ta', difficulty: 1 },
  { pinyin: 'na', difficulty: 1 },
  { pinyin: 'la', difficulty: 1 },
  { pinyin: 'ga', difficulty: 1 },
  { pinyin: 'ka', difficulty: 1 },
  { pinyin: 'ha', difficulty: 1 },
  { pinyin: 'bo', difficulty: 1 },
  { pinyin: 'po', difficulty: 1 },
  { pinyin: 'mo', difficulty: 1 },
  { pinyin: 'fo', difficulty: 1 },
  { pinyin: 'de', difficulty: 1 },
  { pinyin: 'te', difficulty: 1 },
  { pinyin: 'ne', difficulty: 1 },
  { pinyin: 'le', difficulty: 1 },
  { pinyin: 'ge', difficulty: 1 },
  { pinyin: 'ke', difficulty: 1 },
  { pinyin: 'he', difficulty: 1 },
  { pinyin: 'me', difficulty: 1 },

  // ===== Difficulty 2: Simple syllables with nasal finals or common diphthongs =====
  { pinyin: 'ai', difficulty: 2 },
  { pinyin: 'ei', difficulty: 2 },
  { pinyin: 'ao', difficulty: 2 },
  { pinyin: 'ou', difficulty: 2 },
  { pinyin: 'an', difficulty: 2 },
  { pinyin: 'en', difficulty: 2 },
  { pinyin: 'ang', difficulty: 2 },
  { pinyin: 'eng', difficulty: 2 },
  { pinyin: 'ban', difficulty: 2 },
  { pinyin: 'pan', difficulty: 2 },
  { pinyin: 'man', difficulty: 2 },
  { pinyin: 'fan', difficulty: 2 },
  { pinyin: 'dan', difficulty: 2 },
  { pinyin: 'tan', difficulty: 2 },
  { pinyin: 'nan', difficulty: 2 },
  { pinyin: 'lan', difficulty: 2 },
  { pinyin: 'gan', difficulty: 2 },
  { pinyin: 'kan', difficulty: 2 },
  { pinyin: 'han', difficulty: 2 },
  { pinyin: 'bang', difficulty: 2 },
  { pinyin: 'pang', difficulty: 2 },
  { pinyin: 'mang', difficulty: 2 },
  { pinyin: 'fang', difficulty: 2 },
  { pinyin: 'dang', difficulty: 2 },
  { pinyin: 'tang', difficulty: 2 },
  { pinyin: 'nang', difficulty: 2 },
  { pinyin: 'lang', difficulty: 2 },
  { pinyin: 'gang', difficulty: 2 },
  { pinyin: 'kang', difficulty: 2 },
  { pinyin: 'hang', difficulty: 2 },
  { pinyin: 'bai', difficulty: 2 },
  { pinyin: 'pai', difficulty: 2 },
  { pinyin: 'mai', difficulty: 2 },
  { pinyin: 'dai', difficulty: 2 },
  { pinyin: 'tai', difficulty: 2 },
  { pinyin: 'nai', difficulty: 2 },
  { pinyin: 'lai', difficulty: 2 },
  { pinyin: 'gai', difficulty: 2 },
  { pinyin: 'kai', difficulty: 2 },
  { pinyin: 'hai', difficulty: 2 },
  { pinyin: 'bei', difficulty: 2 },
  { pinyin: 'pei', difficulty: 2 },
  { pinyin: 'mei', difficulty: 2 },
  { pinyin: 'fei', difficulty: 2 },
  { pinyin: 'dei', difficulty: 2 },
  { pinyin: 'nei', difficulty: 2 },
  { pinyin: 'lei', difficulty: 2 },
  { pinyin: 'gei', difficulty: 2 },
  { pinyin: 'hei', difficulty: 2 },

  // ===== Difficulty 3: Alveolo-palatal initials (j, q, x) + common finals =====
  // OR Retroflex initials (zh, ch, sh, r) + simple finals
  // OR Complex finals (iao, ian, iang, uai, uan, etc.)
  { pinyin: 'ji', difficulty: 3 },
  { pinyin: 'qi', difficulty: 3 },
  { pinyin: 'xi', difficulty: 3 },
  { pinyin: 'jia', difficulty: 3 },
  { pinyin: 'qia', difficulty: 3 },
  { pinyin: 'xia', difficulty: 3 },
  { pinyin: 'jie', difficulty: 3 },
  { pinyin: 'qie', difficulty: 3 },
  { pinyin: 'xie', difficulty: 3 },
  { pinyin: 'jiao', difficulty: 3 },
  { pinyin: 'qiao', difficulty: 3 },
  { pinyin: 'xiao', difficulty: 3 },
  { pinyin: 'jiu', difficulty: 3 },
  { pinyin: 'qiu', difficulty: 3 },
  { pinyin: 'xiu', difficulty: 3 },
  { pinyin: 'jian', difficulty: 3 },
  { pinyin: 'qian', difficulty: 3 },
  { pinyin: 'xian', difficulty: 3 },
  { pinyin: 'jiang', difficulty: 3 },
  { pinyin: 'qiang', difficulty: 3 },
  { pinyin: 'xiang', difficulty: 3 },
  { pinyin: 'zhi', difficulty: 3 },
  { pinyin: 'chi', difficulty: 3 },
  { pinyin: 'shi', difficulty: 3 },
  { pinyin: 'ri', difficulty: 3 },
  { pinyin: 'zha', difficulty: 3 },
  { pinyin: 'cha', difficulty: 3 },
  { pinyin: 'sha', difficulty: 3 },
  { pinyin: 'zhang', difficulty: 3 },
  { pinyin: 'chang', difficulty: 3 },
  { pinyin: 'shang', difficulty: 3 },
  { pinyin: 'rang', difficulty: 3 },
  { pinyin: 'liao', difficulty: 3 },
  { pinyin: 'miao', difficulty: 3 },
  { pinyin: 'niao', difficulty: 3 },
  { pinyin: 'piao', difficulty: 3 },
  { pinyin: 'biao', difficulty: 3 },
  { pinyin: 'diao', difficulty: 3 },
  { pinyin: 'tiao', difficulty: 3 },

  // ===== Difficulty 4: Retroflex + complex finals, OR ü-containing syllables =====
  // OR Particularly challenging tone sequences
  { pinyin: 'zhu', difficulty: 4 },
  { pinyin: 'chu', difficulty: 4 },
  { pinyin: 'shu', difficulty: 4 },
  { pinyin: 'ru', difficulty: 4 },
  { pinyin: 'zhuai', difficulty: 4 },
  { pinyin: 'chuai', difficulty: 4 },
  { pinyin: 'shuai', difficulty: 4 },
  { pinyin: 'zhuan', difficulty: 4 },
  { pinyin: 'chuan', difficulty: 4 },
  { pinyin: 'shuan', difficulty: 4 },
  { pinyin: 'ruan', difficulty: 4 },
  { pinyin: 'zhuang', difficulty: 4 },
  { pinyin: 'chuang', difficulty: 4 },
  { pinyin: 'shuang', difficulty: 4 },
  { pinyin: 'ju', difficulty: 4 },
  { pinyin: 'qu', difficulty: 4 },
  { pinyin: 'xu', difficulty: 4 },
  { pinyin: 'juan', difficulty: 4 },
  { pinyin: 'quan', difficulty: 4 },
  { pinyin: 'xuan', difficulty: 4 },
  { pinyin: 'jun', difficulty: 4 },
  { pinyin: 'qun', difficulty: 4 },
  { pinyin: 'xun', difficulty: 4 },
  { pinyin: 'lü', difficulty: 4 },
  { pinyin: 'nü', difficulty: 4 },
  { pinyin: 'lüe', difficulty: 4 },
  { pinyin: 'nüe', difficulty: 4 },

  // ===== Difficulty 5: Most challenging combinations =====
  // Retroflex + ü-like sounds, or extremely tight articulation
  { pinyin: 'jiong', difficulty: 5 },
  { pinyin: 'qiong', difficulty: 5 },
  { pinyin: 'xiong', difficulty: 5 },
  { pinyin: 'zhong', difficulty: 5 },
  { pinyin: 'chong', difficulty: 5 },
  { pinyin: 'rong', difficulty: 5 },
  { pinyin: 'zi', difficulty: 5 }, // Apical vowel after z
  { pinyin: 'ci', difficulty: 5 }, // Apical vowel after c
  { pinyin: 'si', difficulty: 5 }, // Apical vowel after s

  // Additional common syllables at various difficulties
  { pinyin: 'bing', difficulty: 2 },
  { pinyin: 'ping', difficulty: 2 },
  { pinyin: 'ming', difficulty: 2 },
  { pinyin: 'ding', difficulty: 2 },
  { pinyin: 'ting', difficulty: 2 },
  { pinyin: 'ning', difficulty: 2 },
  { pinyin: 'ling', difficulty: 2 },
  { pinyin: 'bao', difficulty: 2 },
  { pinyin: 'pao', difficulty: 2 },
  { pinyin: 'mao', difficulty: 2 },
  { pinyin: 'dao', difficulty: 2 },
  { pinyin: 'tao', difficulty: 2 },
  { pinyin: 'nao', difficulty: 2 },
  { pinyin: 'lao', difficulty: 2 },
  { pinyin: 'gao', difficulty: 2 },
  { pinyin: 'kao', difficulty: 2 },
  { pinyin: 'hao', difficulty: 2 },
  { pinyin: 'zhao', difficulty: 3 },
  { pinyin: 'chao', difficulty: 3 },
  { pinyin: 'shao', difficulty: 3 },
  { pinyin: 'rao', difficulty: 3 },
  { pinyin: 'zhou', difficulty: 4 },
  { pinyin: 'chou', difficulty: 4 },
  { pinyin: 'shou', difficulty: 4 },
  { pinyin: 'rou', difficulty: 4 },
];

/**
 * Get syllables filtered by difficulty range
 */
export function getSyllablesByDifficulty(minDiff: number, maxDiff: number): Syllable[] {
  return SYLLABLE_INVENTORY.filter(s => s.difficulty >= minDiff && s.difficulty <= maxDiff);
}

/**
 * Get syllables excluding a specific set
 */
export function filterExcludedSyllables(syllables: Syllable[], excluded: Set<string>): Syllable[] {
  return syllables.filter(s => !excluded.has(s.pinyin));
}
