/**
 * Similar Characters Database
 *
 * A comprehensive list of visually similar Chinese character pairs.
 * Used to generate practice exercises filtered by user's vocabulary.
 */

import type { VocabularyEntry } from '../types/vocabulary';

/**
 * Pairs of visually similar Chinese characters.
 * Format: [character1, character2]
 */
export const SIMILAR_CHARACTER_PAIRS: [string, string][] = [
  // Basic similar pairs - commonly confused
  ['人', '入'],
  ['大', '太'],
  ['大', '犬'],
  ['太', '犬'],
  ['木', '本'],
  ['木', '末'],
  ['本', '末'],
  ['日', '目'],
  ['日', '白'],
  ['目', '自'],
  ['土', '士'],
  ['土', '王'],
  ['士', '干'],
  ['己', '已'],
  ['己', '巳'],
  ['已', '巳'],
  ['未', '末'],
  ['天', '夫'],
  ['天', '夭'],
  ['夫', '失'],
  ['午', '牛'],
  ['千', '干'],
  ['千', '于'],
  ['干', '于'],
  ['方', '万'],
  ['刀', '力'],
  ['刀', '九'],
  ['力', '九'],
  ['又', '叉'],
  ['口', '曰'],
  ['由', '田'],
  ['由', '申'],
  ['田', '甲'],
  ['田', '申'],
  ['甲', '申'],
  ['月', '用'],
  ['月', '目'],
  ['用', '甩'],
  ['冫', '氵'],
  ['辶', '廴'],

  // Numbers and counting
  ['一', '二'],
  ['二', '三'],
  ['十', '千'],

  // Body parts
  ['手', '毛'],
  ['目', '耳'],
  ['足', '是'],

  // Animals
  ['马', '鸟'],
  ['鱼', '角'],
  ['犬', '太'],
  ['牛', '午'],
  ['羊', '半'],

  // Nature elements
  ['山', '出'],
  ['水', '永'],
  ['火', '灭'],
  ['木', '林'],
  ['林', '森'],
  ['石', '右'],
  ['左', '右'],

  // Common radicals
  ['讠', '氵'],
  ['亻', '彳'],
  ['纟', '糸'],
  ['钅', '金'],
  ['饣', '食'],

  // Movement/action
  ['走', '起'],
  ['跑', '跳'],
  ['来', '米'],
  ['去', '云'],
  ['进', '近'],
  ['远', '运'],
  ['过', '进'],

  // Time related
  ['时', '待'],
  ['明', '朋'],
  ['晴', '睛'],
  ['暖', '暗'],
  ['早', '草'],

  // Buildings/locations
  ['门', '闪'],
  ['问', '闻'],
  ['间', '闲'],
  ['房', '访'],

  // Common confusions
  ['见', '贝'],
  ['只', '叫'],
  ['少', '小'],
  ['多', '夕'],
  ['夕', '外'],
  ['外', '处'],
  ['处', '外'],
  ['东', '车'],
  ['车', '东'],
  ['书', '画'],
  ['事', '是'],
  ['很', '银'],
  ['跟', '眼'],
  ['给', '合'],
  ['合', '会'],
  ['会', '今'],
  ['今', '令'],
  ['今', '金'],
  ['全', '金'],
  ['话', '活'],
  ['说', '话'],
  ['请', '情'],
  ['清', '情'],
  ['清', '晴'],
  ['晴', '睛'],
  ['精', '睛'],
  ['青', '清'],
  ['青', '请'],
  ['青', '晴'],
  ['青', '情'],
  ['红', '工'],
  ['江', '工'],
  ['功', '工'],

  // Similar-sounding pairs that look alike
  ['买', '卖'],
  ['那', '哪'],
  ['把', '吧'],
  ['做', '作'],
  ['坐', '座'],
  ['象', '像'],
  ['以', '已'],
  ['在', '再'],
  ['同', '桐'],
  ['同', '铜'],
  ['公', '共'],
  ['关', '关'],
  ['开', '并'],
  ['并', '井'],
  ['没', '设'],
  ['投', '没'],
  ['般', '船'],
  ['船', '舟'],
  ['住', '注'],
  ['注', '往'],
  ['往', '住'],

  // Complex characters
  ['影', '景'],
  ['景', '京'],
  ['读', '续'],
  ['该', '改'],
  ['海', '每'],
  ['每', '毎'],
  ['孩', '该'],
  ['园', '圆'],
  ['圆', '员'],
  ['远', '园'],
  ['原', '源'],
  ['愿', '原'],
  ['喝', '渴'],
  ['饿', '俄'],
  ['城', '成'],
  ['诚', '城'],
  ['想', '相'],
  ['相', '想'],
  ['箱', '想'],
  ['香', '相'],

  // Verbs with similar forms
  ['打', '扑'],
  ['拿', '拳'],
  ['提', '题'],
  ['题', '提'],
  ['接', '按'],
  ['找', '我'],
  ['我', '成'],
  ['或', '成'],
  ['感', '咸'],
  ['减', '感'],
  ['推', '堆'],
  ['堆', '谁'],
  ['谁', '推'],
  ['准', '谁'],
  ['难', '准'],
  ['推', '维'],
  ['维', '雄'],
  ['推', '准'],
  ['最', '取'],
  ['取', '聚'],

  // Measure words and numbers
  ['第', '弟'],
  ['弟', '第'],
  ['低', '底'],
  ['底', '低'],
  ['两', '雨'],
  ['雨', '两'],
  ['零', '雪'],

  // Emotions/states
  ['快', '决'],
  ['决', '块'],
  ['块', '快'],
  ['怕', '拍'],
  ['拍', '怕'],
  ['抱', '饱'],
  ['饱', '抱'],
  ['跑', '抱'],
  ['炮', '跑'],
  ['胖', '伴'],
  ['半', '伴'],
  ['伴', '拌'],
  ['烦', '板'],
  ['板', '版'],

  // More common pairs
  ['报', '服'],
  ['被', '披'],
  ['比', '北'],
  ['北', '此'],
  ['必', '心'],
  ['边', '这'],
  ['遍', '编'],
  ['变', '便'],
  ['便', '使'],
  ['表', '衣'],
  ['别', '另'],
  ['病', '丙'],
  ['步', '少'],
  ['部', '陪'],
  ['才', '于'],
  ['菜', '采'],
  ['参', '叁'],
  ['差', '着'],
  ['常', '尚'],
  ['唱', '昌'],
  ['朝', '期'],
  ['吵', '抄'],
  ['陈', '东'],
  ['衬', '村'],
  ['称', '你'],
  ['诚', '城'],
  ['程', '呈'],
  ['持', '特'],
  ['冲', '充'],
  ['崇', '祟'],
  ['初', '抽'],
  ['除', '徐'],
  ['楚', '林'],
  ['传', '转'],
  ['窗', '疮'],
  ['床', '状'],
  ['春', '看'],
  ['纯', '顿'],
];

/**
 * Get similar character pairs that are both present in the user's vocabulary.
 * Returns pairs where both characters appear in the user's vocabulary words.
 */
export function getSimilarPairsForVocabulary(
  vocabulary: VocabularyEntry[]
): [string, string][] {
  // Extract all unique characters from vocabulary
  const userChars = new Set<string>();
  vocabulary.forEach(entry => {
    for (const char of entry.word) {
      userChars.add(char);
    }
  });

  // Filter pairs to only include those where both characters are in user's vocabulary
  return SIMILAR_CHARACTER_PAIRS.filter(
    ([a, b]) => userChars.has(a) && userChars.has(b)
  );
}

/**
 * Get the count of similar character pairs available for the vocabulary.
 */
export function getSimilarPairsCount(vocabulary: VocabularyEntry[]): number {
  return getSimilarPairsForVocabulary(vocabulary).length;
}
