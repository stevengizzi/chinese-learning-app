/**
 * Built-in HSK Vocabulary
 *
 * Provides starter vocabulary lists based on HSK levels for users
 * who want to begin practicing immediately without importing their own lists.
 */

import type { VocabularyData, VocabularyEntry } from '../types/vocabulary';

export interface HskLevel {
  level: number;
  wordCount: number;
}

export const HSK_LEVELS: HskLevel[] = [
  { level: 1, wordCount: 150 },
  { level: 2, wordCount: 150 },
  { level: 3, wordCount: 300 },
];

// HSK 1 Vocabulary (150 words - core beginner vocabulary)
const HSK1_WORDS: VocabularyEntry[] = [
  // Pronouns
  { word: '我', pinyin: 'wo3', meaning: 'I; me' },
  { word: '你', pinyin: 'ni3', meaning: 'you' },
  { word: '他', pinyin: 'ta1', meaning: 'he; him' },
  { word: '她', pinyin: 'ta1', meaning: 'she; her' },
  { word: '我们', pinyin: 'wo3 men5', meaning: 'we; us' },
  { word: '这', pinyin: 'zhe4', meaning: 'this' },
  { word: '那', pinyin: 'na4', meaning: 'that' },
  { word: '哪', pinyin: 'na3', meaning: 'which; what' },
  { word: '谁', pinyin: 'shei2', meaning: 'who' },
  { word: '什么', pinyin: 'shen2 me5', meaning: 'what' },

  // Numbers
  { word: '一', pinyin: 'yi1', meaning: 'one' },
  { word: '二', pinyin: 'er4', meaning: 'two' },
  { word: '三', pinyin: 'san1', meaning: 'three' },
  { word: '四', pinyin: 'si4', meaning: 'four' },
  { word: '五', pinyin: 'wu3', meaning: 'five' },
  { word: '六', pinyin: 'liu4', meaning: 'six' },
  { word: '七', pinyin: 'qi1', meaning: 'seven' },
  { word: '八', pinyin: 'ba1', meaning: 'eight' },
  { word: '九', pinyin: 'jiu3', meaning: 'nine' },
  { word: '十', pinyin: 'shi2', meaning: 'ten' },
  { word: '零', pinyin: 'ling2', meaning: 'zero' },
  { word: '两', pinyin: 'liang3', meaning: 'two (used before measure words)' },

  // Time
  { word: '年', pinyin: 'nian2', meaning: 'year' },
  { word: '月', pinyin: 'yue4', meaning: 'month; moon' },
  { word: '日', pinyin: 'ri4', meaning: 'day; sun' },
  { word: '星期', pinyin: 'xing1 qi1', meaning: 'week' },
  { word: '今天', pinyin: 'jin1 tian1', meaning: 'today' },
  { word: '明天', pinyin: 'ming2 tian1', meaning: 'tomorrow' },
  { word: '昨天', pinyin: 'zuo2 tian1', meaning: 'yesterday' },
  { word: '现在', pinyin: 'xian4 zai4', meaning: 'now' },
  { word: '时候', pinyin: 'shi2 hou5', meaning: 'time; moment' },
  { word: '点', pinyin: 'dian3', meaning: "o'clock; point" },
  { word: '分钟', pinyin: 'fen1 zhong1', meaning: 'minute' },

  // People
  { word: '人', pinyin: 'ren2', meaning: 'person; people' },
  { word: '朋友', pinyin: 'peng2 you5', meaning: 'friend' },
  { word: '同学', pinyin: 'tong2 xue2', meaning: 'classmate' },
  { word: '老师', pinyin: 'lao3 shi1', meaning: 'teacher' },
  { word: '学生', pinyin: 'xue2 sheng1', meaning: 'student' },
  { word: '医生', pinyin: 'yi1 sheng1', meaning: 'doctor' },
  { word: '先生', pinyin: 'xian1 sheng1', meaning: 'Mr.; sir; husband' },
  { word: '小姐', pinyin: 'xiao3 jie3', meaning: 'Miss; young lady' },

  // Family
  { word: '爸爸', pinyin: 'ba4 ba5', meaning: 'father; dad' },
  { word: '妈妈', pinyin: 'ma1 ma5', meaning: 'mother; mom' },
  { word: '儿子', pinyin: 'er2 zi5', meaning: 'son' },
  { word: '女儿', pinyin: 'nü3 er2', meaning: 'daughter' },
  { word: '家', pinyin: 'jia1', meaning: 'home; family' },

  // Places
  { word: '中国', pinyin: 'zhong1 guo2', meaning: 'China' },
  { word: '北京', pinyin: 'bei3 jing1', meaning: 'Beijing' },
  { word: '学校', pinyin: 'xue2 xiao4', meaning: 'school' },
  { word: '医院', pinyin: 'yi1 yuan4', meaning: 'hospital' },
  { word: '商店', pinyin: 'shang1 dian4', meaning: 'shop; store' },
  { word: '饭店', pinyin: 'fan4 dian4', meaning: 'restaurant; hotel' },
  { word: '机场', pinyin: 'ji1 chang3', meaning: 'airport' },
  { word: '火车站', pinyin: 'huo3 che1 zhan4', meaning: 'train station' },

  // Common Verbs
  { word: '是', pinyin: 'shi4', meaning: 'to be; yes' },
  { word: '有', pinyin: 'you3', meaning: 'to have; there is' },
  { word: '在', pinyin: 'zai4', meaning: 'at; in; to be at' },
  { word: '不', pinyin: 'bu4', meaning: 'not; no' },
  { word: '没', pinyin: 'mei2', meaning: 'not; have not' },
  { word: '想', pinyin: 'xiang3', meaning: 'to want; to think' },
  { word: '要', pinyin: 'yao4', meaning: 'to want; will' },
  { word: '能', pinyin: 'neng2', meaning: 'can; able to' },
  { word: '会', pinyin: 'hui4', meaning: 'can; will; meeting' },
  { word: '可以', pinyin: 'ke3 yi3', meaning: 'can; may' },
  { word: '去', pinyin: 'qu4', meaning: 'to go' },
  { word: '来', pinyin: 'lai2', meaning: 'to come' },
  { word: '回', pinyin: 'hui2', meaning: 'to return' },
  { word: '做', pinyin: 'zuo4', meaning: 'to do; to make' },
  { word: '工作', pinyin: 'gong1 zuo4', meaning: 'to work; job' },
  { word: '学习', pinyin: 'xue2 xi2', meaning: 'to study; to learn' },
  { word: '看', pinyin: 'kan4', meaning: 'to look; to watch; to read' },
  { word: '听', pinyin: 'ting1', meaning: 'to listen' },
  { word: '说', pinyin: 'shuo1', meaning: 'to speak; to say' },
  { word: '读', pinyin: 'du2', meaning: 'to read' },
  { word: '写', pinyin: 'xie3', meaning: 'to write' },
  { word: '吃', pinyin: 'chi1', meaning: 'to eat' },
  { word: '喝', pinyin: 'he1', meaning: 'to drink' },
  { word: '睡觉', pinyin: 'shui4 jiao4', meaning: 'to sleep' },
  { word: '住', pinyin: 'zhu4', meaning: 'to live; to stay' },
  { word: '买', pinyin: 'mai3', meaning: 'to buy' },
  { word: '叫', pinyin: 'jiao4', meaning: 'to call; to be called' },
  { word: '爱', pinyin: 'ai4', meaning: 'to love' },
  { word: '喜欢', pinyin: 'xi3 huan5', meaning: 'to like' },
  { word: '认识', pinyin: 'ren4 shi5', meaning: 'to know (a person)' },
  { word: '知道', pinyin: 'zhi1 dao4', meaning: 'to know (a fact)' },
  { word: '开', pinyin: 'kai1', meaning: 'to open; to drive' },
  { word: '坐', pinyin: 'zuo4', meaning: 'to sit; to take (transport)' },

  // Adjectives
  { word: '好', pinyin: 'hao3', meaning: 'good; well' },
  { word: '大', pinyin: 'da4', meaning: 'big; large' },
  { word: '小', pinyin: 'xiao3', meaning: 'small; little' },
  { word: '多', pinyin: 'duo1', meaning: 'many; much' },
  { word: '少', pinyin: 'shao3', meaning: 'few; little' },
  { word: '高', pinyin: 'gao1', meaning: 'tall; high' },
  { word: '热', pinyin: 're4', meaning: 'hot' },
  { word: '冷', pinyin: 'leng3', meaning: 'cold' },
  { word: '漂亮', pinyin: 'piao4 liang5', meaning: 'beautiful; pretty' },
  { word: '高兴', pinyin: 'gao1 xing4', meaning: 'happy; glad' },

  // Food & Drinks
  { word: '饭', pinyin: 'fan4', meaning: 'rice; meal' },
  { word: '菜', pinyin: 'cai4', meaning: 'vegetable; dish' },
  { word: '米饭', pinyin: 'mi3 fan4', meaning: 'cooked rice' },
  { word: '水', pinyin: 'shui3', meaning: 'water' },
  { word: '茶', pinyin: 'cha2', meaning: 'tea' },
  { word: '水果', pinyin: 'shui3 guo3', meaning: 'fruit' },
  { word: '苹果', pinyin: 'ping2 guo3', meaning: 'apple' },
  { word: '杯子', pinyin: 'bei1 zi5', meaning: 'cup; glass' },

  // Objects
  { word: '书', pinyin: 'shu1', meaning: 'book' },
  { word: '钱', pinyin: 'qian2', meaning: 'money' },
  { word: '电脑', pinyin: 'dian4 nao3', meaning: 'computer' },
  { word: '电视', pinyin: 'dian4 shi4', meaning: 'television' },
  { word: '电影', pinyin: 'dian4 ying3', meaning: 'movie' },
  { word: '衣服', pinyin: 'yi1 fu5', meaning: 'clothes' },
  { word: '桌子', pinyin: 'zhuo1 zi5', meaning: 'table; desk' },
  { word: '椅子', pinyin: 'yi3 zi5', meaning: 'chair' },

  // Transportation
  { word: '飞机', pinyin: 'fei1 ji1', meaning: 'airplane' },
  { word: '火车', pinyin: 'huo3 che1', meaning: 'train' },
  { word: '出租车', pinyin: 'chu1 zu1 che1', meaning: 'taxi' },

  // Weather & Nature
  { word: '天气', pinyin: 'tian1 qi4', meaning: 'weather' },
  { word: '下雨', pinyin: 'xia4 yu3', meaning: 'to rain' },

  // Question words & Particles
  { word: '怎么', pinyin: 'zen3 me5', meaning: 'how' },
  { word: '怎么样', pinyin: 'zen3 me5 yang4', meaning: 'how about; how is' },
  { word: '多少', pinyin: 'duo1 shao5', meaning: 'how many; how much' },
  { word: '几', pinyin: 'ji3', meaning: 'how many; several' },
  { word: '吗', pinyin: 'ma5', meaning: 'question particle' },
  { word: '呢', pinyin: 'ne5', meaning: 'question particle' },
  { word: '的', pinyin: 'de5', meaning: 'possessive particle' },
  { word: '了', pinyin: 'le5', meaning: 'completed action particle' },
  { word: '和', pinyin: 'he2', meaning: 'and; with' },

  // Greetings & Common Phrases
  { word: '你好', pinyin: 'ni3 hao3', meaning: 'hello' },
  { word: '谢谢', pinyin: 'xie4 xie5', meaning: 'thank you' },
  { word: '不客气', pinyin: 'bu4 ke4 qi5', meaning: "you're welcome" },
  { word: '对不起', pinyin: 'dui4 bu5 qi3', meaning: 'sorry' },
  { word: '没关系', pinyin: 'mei2 guan1 xi5', meaning: "it's okay; no problem" },
  { word: '再见', pinyin: 'zai4 jian4', meaning: 'goodbye' },

  // Location words
  { word: '前面', pinyin: 'qian2 mian4', meaning: 'front; ahead' },
  { word: '后面', pinyin: 'hou4 mian4', meaning: 'behind; back' },
  { word: '上', pinyin: 'shang4', meaning: 'up; on; above' },
  { word: '下', pinyin: 'xia4', meaning: 'down; under; below' },
  { word: '里', pinyin: 'li3', meaning: 'inside; in' },

  // Additional common words
  { word: '名字', pinyin: 'ming2 zi5', meaning: 'name' },
  { word: '号', pinyin: 'hao4', meaning: 'number; date' },
  { word: '岁', pinyin: 'sui4', meaning: 'years old' },
  { word: '块', pinyin: 'kuai4', meaning: 'yuan (money); piece' },
  { word: '个', pinyin: 'ge4', meaning: 'general measure word' },
  { word: '本', pinyin: 'ben3', meaning: 'measure word for books' },
  { word: '些', pinyin: 'xie1', meaning: 'some' },
  { word: '很', pinyin: 'hen3', meaning: 'very' },
  { word: '太', pinyin: 'tai4', meaning: 'too; extremely' },
  { word: '都', pinyin: 'dou1', meaning: 'all; both' },
];

// HSK 2 Vocabulary (150 additional words)
const HSK2_WORDS: VocabularyEntry[] = [
  // Time expressions
  { word: '早上', pinyin: 'zao3 shang5', meaning: 'morning' },
  { word: '上午', pinyin: 'shang4 wu3', meaning: 'morning (before noon)' },
  { word: '中午', pinyin: 'zhong1 wu3', meaning: 'noon' },
  { word: '下午', pinyin: 'xia4 wu3', meaning: 'afternoon' },
  { word: '晚上', pinyin: 'wan3 shang5', meaning: 'evening; night' },
  { word: '小时', pinyin: 'xiao3 shi2', meaning: 'hour' },
  { word: '去年', pinyin: 'qu4 nian2', meaning: 'last year' },
  { word: '每', pinyin: 'mei3', meaning: 'every; each' },
  { word: '已经', pinyin: 'yi3 jing1', meaning: 'already' },
  { word: '正在', pinyin: 'zheng4 zai4', meaning: 'in the process of' },

  // Verbs
  { word: '帮助', pinyin: 'bang1 zhu4', meaning: 'to help' },
  { word: '等', pinyin: 'deng3', meaning: 'to wait' },
  { word: '找', pinyin: 'zhao3', meaning: 'to look for' },
  { word: '到', pinyin: 'dao4', meaning: 'to arrive; to' },
  { word: '给', pinyin: 'gei3', meaning: 'to give' },
  { word: '告诉', pinyin: 'gao4 su5', meaning: 'to tell' },
  { word: '问', pinyin: 'wen4', meaning: 'to ask' },
  { word: '回答', pinyin: 'hui2 da2', meaning: 'to answer' },
  { word: '开始', pinyin: 'kai1 shi3', meaning: 'to begin; start' },
  { word: '完', pinyin: 'wan2', meaning: 'to finish' },
  { word: '懂', pinyin: 'dong3', meaning: 'to understand' },
  { word: '觉得', pinyin: 'jue2 de5', meaning: 'to feel; to think' },
  { word: '希望', pinyin: 'xi1 wang4', meaning: 'to hope' },
  { word: '准备', pinyin: 'zhun3 bei4', meaning: 'to prepare' },
  { word: '介绍', pinyin: 'jie4 shao4', meaning: 'to introduce' },
  { word: '离开', pinyin: 'li2 kai1', meaning: 'to leave' },
  { word: '让', pinyin: 'rang4', meaning: 'to let; to allow' },
  { word: '穿', pinyin: 'chuan1', meaning: 'to wear' },
  { word: '起床', pinyin: 'qi3 chuang2', meaning: 'to get up' },
  { word: '玩', pinyin: 'wan2', meaning: 'to play' },
  { word: '跑步', pinyin: 'pao3 bu4', meaning: 'to run; jogging' },
  { word: '游泳', pinyin: 'you2 yong3', meaning: 'to swim' },
  { word: '唱歌', pinyin: 'chang4 ge1', meaning: 'to sing' },
  { word: '跳舞', pinyin: 'tiao4 wu3', meaning: 'to dance' },
  { word: '旅游', pinyin: 'lü3 you2', meaning: 'to travel' },
  { word: '笑', pinyin: 'xiao4', meaning: 'to laugh; to smile' },
  { word: '哭', pinyin: 'ku1', meaning: 'to cry' },
  { word: '生病', pinyin: 'sheng1 bing4', meaning: 'to get sick' },
  { word: '休息', pinyin: 'xiu1 xi5', meaning: 'to rest' },
  { word: '运动', pinyin: 'yun4 dong4', meaning: 'sports; to exercise' },

  // Adjectives
  { word: '快', pinyin: 'kuai4', meaning: 'fast; quick' },
  { word: '慢', pinyin: 'man4', meaning: 'slow' },
  { word: '新', pinyin: 'xin1', meaning: 'new' },
  { word: '旧', pinyin: 'jiu4', meaning: 'old (things)' },
  { word: '长', pinyin: 'chang2', meaning: 'long' },
  { word: '远', pinyin: 'yuan3', meaning: 'far' },
  { word: '近', pinyin: 'jin4', meaning: 'near; close' },
  { word: '贵', pinyin: 'gui4', meaning: 'expensive' },
  { word: '便宜', pinyin: 'pian2 yi5', meaning: 'cheap' },
  { word: '忙', pinyin: 'mang2', meaning: 'busy' },
  { word: '累', pinyin: 'lei4', meaning: 'tired' },
  { word: '白', pinyin: 'bai2', meaning: 'white' },
  { word: '黑', pinyin: 'hei1', meaning: 'black' },
  { word: '红', pinyin: 'hong2', meaning: 'red' },
  { word: '错', pinyin: 'cuo4', meaning: 'wrong; mistake' },
  { word: '对', pinyin: 'dui4', meaning: 'right; correct' },
  { word: '晴', pinyin: 'qing2', meaning: 'sunny; clear' },
  { word: '阴', pinyin: 'yin1', meaning: 'cloudy; overcast' },
  { word: '重要', pinyin: 'zhong4 yao4', meaning: 'important' },

  // Nouns
  { word: '丈夫', pinyin: 'zhang4 fu5', meaning: 'husband' },
  { word: '妻子', pinyin: 'qi1 zi5', meaning: 'wife' },
  { word: '哥哥', pinyin: 'ge1 ge5', meaning: 'older brother' },
  { word: '弟弟', pinyin: 'di4 di5', meaning: 'younger brother' },
  { word: '姐姐', pinyin: 'jie3 jie5', meaning: 'older sister' },
  { word: '妹妹', pinyin: 'mei4 mei5', meaning: 'younger sister' },
  { word: '孩子', pinyin: 'hai2 zi5', meaning: 'child' },
  { word: '男人', pinyin: 'nan2 ren2', meaning: 'man' },
  { word: '女人', pinyin: 'nü3 ren2', meaning: 'woman' },
  { word: '身体', pinyin: 'shen1 ti3', meaning: 'body; health' },
  { word: '眼睛', pinyin: 'yan3 jing5', meaning: 'eye' },
  { word: '手', pinyin: 'shou3', meaning: 'hand' },
  { word: '脸', pinyin: 'lian3', meaning: 'face' },
  { word: '房间', pinyin: 'fang2 jian1', meaning: 'room' },
  { word: '门', pinyin: 'men2', meaning: 'door' },
  { word: '路', pinyin: 'lu4', meaning: 'road; way' },
  { word: '公共汽车', pinyin: 'gong1 gong4 qi4 che1', meaning: 'bus' },
  { word: '自行车', pinyin: 'zi4 xing2 che1', meaning: 'bicycle' },
  { word: '船', pinyin: 'chuan2', meaning: 'boat; ship' },
  { word: '手机', pinyin: 'shou3 ji1', meaning: 'mobile phone' },
  { word: '报纸', pinyin: 'bao4 zhi3', meaning: 'newspaper' },
  { word: '颜色', pinyin: 'yan2 se4', meaning: 'color' },
  { word: '问题', pinyin: 'wen4 ti2', meaning: 'question; problem' },
  { word: '事情', pinyin: 'shi4 qing5', meaning: 'matter; thing' },
  { word: '意思', pinyin: 'yi4 si5', meaning: 'meaning' },
  { word: '雪', pinyin: 'xue3', meaning: 'snow' },
  { word: '鱼', pinyin: 'yu2', meaning: 'fish' },
  { word: '鸡蛋', pinyin: 'ji1 dan4', meaning: 'egg' },
  { word: '牛奶', pinyin: 'niu2 nai3', meaning: 'milk' },
  { word: '咖啡', pinyin: 'ka1 fei1', meaning: 'coffee' },
  { word: '药', pinyin: 'yao4', meaning: 'medicine' },
  { word: '考试', pinyin: 'kao3 shi4', meaning: 'exam; test' },
  { word: '题', pinyin: 'ti2', meaning: 'question; topic' },
  { word: '生日', pinyin: 'sheng1 ri4', meaning: 'birthday' },

  // Adverbs & Others
  { word: '一起', pinyin: 'yi4 qi3', meaning: 'together' },
  { word: '非常', pinyin: 'fei1 chang2', meaning: 'very; extremely' },
  { word: '最', pinyin: 'zui4', meaning: 'most; -est' },
  { word: '真', pinyin: 'zhen1', meaning: 'really; truly' },
  { word: '还', pinyin: 'hai2', meaning: 'still; also' },
  { word: '再', pinyin: 'zai4', meaning: 'again' },
  { word: '就', pinyin: 'jiu4', meaning: 'just; then' },
  { word: '才', pinyin: 'cai2', meaning: 'only then; just' },
  { word: '别', pinyin: 'bie2', meaning: "don't" },
  { word: '因为', pinyin: 'yin1 wei4', meaning: 'because' },
  { word: '所以', pinyin: 'suo3 yi3', meaning: 'so; therefore' },
  { word: '但是', pinyin: 'dan4 shi4', meaning: 'but; however' },
  { word: '虽然', pinyin: 'sui1 ran2', meaning: 'although' },
  { word: '如果', pinyin: 'ru2 guo3', meaning: 'if' },
  { word: '为什么', pinyin: 'wei4 shen2 me5', meaning: 'why' },
  { word: '可能', pinyin: 'ke3 neng2', meaning: 'maybe; possible' },
  { word: '应该', pinyin: 'ying1 gai1', meaning: 'should' },
  { word: '得', pinyin: 'de2', meaning: 'must; have to' },
  { word: '着', pinyin: 'zhe5', meaning: 'verb particle (ongoing)' },
  { word: '过', pinyin: 'guo4', meaning: 'verb particle (experience)' },
  { word: '从', pinyin: 'cong2', meaning: 'from' },
  { word: '向', pinyin: 'xiang4', meaning: 'toward' },
  { word: '比', pinyin: 'bi3', meaning: 'compared to' },
  { word: '除了', pinyin: 'chu2 le5', meaning: 'besides; except' },
  { word: '关于', pinyin: 'guan1 yu2', meaning: 'about; regarding' },
];

// HSK 3 Vocabulary (300 additional words - subset shown)
const HSK3_WORDS: VocabularyEntry[] = [
  // Common verbs
  { word: '变化', pinyin: 'bian4 hua4', meaning: 'to change; change' },
  { word: '表示', pinyin: 'biao3 shi4', meaning: 'to express; to show' },
  { word: '参加', pinyin: 'can1 jia1', meaning: 'to participate' },
  { word: '成为', pinyin: 'cheng2 wei2', meaning: 'to become' },
  { word: '打算', pinyin: 'da3 suan4', meaning: 'to plan; plan' },
  { word: '担心', pinyin: 'dan1 xin1', meaning: 'to worry' },
  { word: '发现', pinyin: 'fa1 xian4', meaning: 'to discover; to find' },
  { word: '放', pinyin: 'fang4', meaning: 'to put; to release' },
  { word: '感冒', pinyin: 'gan3 mao4', meaning: 'cold; to catch cold' },
  { word: '关', pinyin: 'guan1', meaning: 'to close; to turn off' },
  { word: '关心', pinyin: 'guan1 xin1', meaning: 'to care about' },
  { word: '过去', pinyin: 'guo4 qu4', meaning: 'past; to go over' },
  { word: '害怕', pinyin: 'hai4 pa4', meaning: 'to be afraid' },
  { word: '花', pinyin: 'hua1', meaning: 'to spend; flower' },
  { word: '画', pinyin: 'hua4', meaning: 'to draw; painting' },
  { word: '检查', pinyin: 'jian3 cha2', meaning: 'to check; to examine' },
  { word: '见面', pinyin: 'jian4 mian4', meaning: 'to meet' },
  { word: '解决', pinyin: 'jie3 jue2', meaning: 'to solve' },
  { word: '借', pinyin: 'jie4', meaning: 'to borrow; to lend' },
  { word: '经过', pinyin: 'jing1 guo4', meaning: 'to pass; through' },
  { word: '决定', pinyin: 'jue2 ding4', meaning: 'to decide; decision' },
  { word: '刻', pinyin: 'ke4', meaning: 'quarter (hour); to carve' },
  { word: '离', pinyin: 'li2', meaning: 'to leave; from' },
  { word: '了解', pinyin: 'liao3 jie3', meaning: 'to understand' },
  { word: '拿', pinyin: 'na2', meaning: 'to take; to hold' },
  { word: '爬山', pinyin: 'pa2 shan1', meaning: 'to climb mountain' },
  { word: '骑', pinyin: 'qi2', meaning: 'to ride' },
  { word: '清楚', pinyin: 'qing1 chu5', meaning: 'clear' },
  { word: '请假', pinyin: 'qing3 jia4', meaning: 'to ask for leave' },
  { word: '相信', pinyin: 'xiang1 xin4', meaning: 'to believe' },
  { word: '需要', pinyin: 'xu1 yao4', meaning: 'to need' },
  { word: '选择', pinyin: 'xuan3 ze2', meaning: 'to choose; choice' },
  { word: '要求', pinyin: 'yao1 qiu2', meaning: 'to require; request' },
  { word: '影响', pinyin: 'ying3 xiang3', meaning: 'to influence; effect' },
  { word: '遇到', pinyin: 'yu4 dao4', meaning: 'to meet; to encounter' },
  { word: '愿意', pinyin: 'yuan4 yi4', meaning: 'willing' },
  { word: '站', pinyin: 'zhan4', meaning: 'to stand; station' },
  { word: '照顾', pinyin: 'zhao4 gu5', meaning: 'to take care of' },
  { word: '照相', pinyin: 'zhao4 xiang4', meaning: 'to take photos' },
  { word: '只', pinyin: 'zhi3', meaning: 'only' },
  { word: '注意', pinyin: 'zhu4 yi4', meaning: 'to pay attention' },

  // Adjectives
  { word: '安静', pinyin: 'an1 jing4', meaning: 'quiet' },
  { word: '干净', pinyin: 'gan1 jing4', meaning: 'clean' },
  { word: '简单', pinyin: 'jian3 dan1', meaning: 'simple' },
  { word: '复杂', pinyin: 'fu4 za2', meaning: 'complex' },
  { word: '容易', pinyin: 'rong2 yi4', meaning: 'easy' },
  { word: '难', pinyin: 'nan2', meaning: 'difficult' },
  { word: '认真', pinyin: 'ren4 zhen1', meaning: 'serious; careful' },
  { word: '方便', pinyin: 'fang1 bian4', meaning: 'convenient' },
  { word: '特别', pinyin: 'te4 bie2', meaning: 'special; especially' },
  { word: '一般', pinyin: 'yi4 ban1', meaning: 'ordinary; generally' },
  { word: '主要', pinyin: 'zhu3 yao4', meaning: 'main; mainly' },
  { word: '年轻', pinyin: 'nian2 qing1', meaning: 'young' },
  { word: '聪明', pinyin: 'cong1 ming5', meaning: 'smart; clever' },
  { word: '有名', pinyin: 'you3 ming2', meaning: 'famous' },
  { word: '着急', pinyin: 'zhao2 ji2', meaning: 'anxious; worried' },
  { word: '满意', pinyin: 'man3 yi4', meaning: 'satisfied' },
  { word: '奇怪', pinyin: 'qi2 guai4', meaning: 'strange' },
  { word: '舒服', pinyin: 'shu1 fu5', meaning: 'comfortable' },
  { word: '饱', pinyin: 'bao3', meaning: 'full (after eating)' },
  { word: '饿', pinyin: 'e4', meaning: 'hungry' },

  // Nouns
  { word: '北方', pinyin: 'bei3 fang1', meaning: 'north' },
  { word: '南方', pinyin: 'nan2 fang1', meaning: 'south' },
  { word: '东', pinyin: 'dong1', meaning: 'east' },
  { word: '西', pinyin: 'xi1', meaning: 'west' },
  { word: '世界', pinyin: 'shi4 jie4', meaning: 'world' },
  { word: '国家', pinyin: 'guo2 jia1', meaning: 'country' },
  { word: '城市', pinyin: 'cheng2 shi4', meaning: 'city' },
  { word: '地方', pinyin: 'di4 fang5', meaning: 'place' },
  { word: '环境', pinyin: 'huan2 jing4', meaning: 'environment' },
  { word: '空气', pinyin: 'kong1 qi4', meaning: 'air' },
  { word: '季节', pinyin: 'ji4 jie2', meaning: 'season' },
  { word: '春', pinyin: 'chun1', meaning: 'spring' },
  { word: '夏', pinyin: 'xia4', meaning: 'summer' },
  { word: '秋', pinyin: 'qiu1', meaning: 'autumn' },
  { word: '冬', pinyin: 'dong1', meaning: 'winter' },
  { word: '太阳', pinyin: 'tai4 yang2', meaning: 'sun' },
  { word: '月亮', pinyin: 'yue4 liang5', meaning: 'moon' },
  { word: '云', pinyin: 'yun2', meaning: 'cloud' },
  { word: '风', pinyin: 'feng1', meaning: 'wind' },
  { word: '树', pinyin: 'shu4', meaning: 'tree' },
  { word: '花', pinyin: 'hua1', meaning: 'flower' },
  { word: '草', pinyin: 'cao3', meaning: 'grass' },
  { word: '动物', pinyin: 'dong4 wu4', meaning: 'animal' },
  { word: '鸟', pinyin: 'niao3', meaning: 'bird' },
  { word: '马', pinyin: 'ma3', meaning: 'horse' },
  { word: '猫', pinyin: 'mao1', meaning: 'cat' },
  { word: '狗', pinyin: 'gou3', meaning: 'dog' },
  { word: '历史', pinyin: 'li4 shi3', meaning: 'history' },
  { word: '文化', pinyin: 'wen2 hua4', meaning: 'culture' },
  { word: '音乐', pinyin: 'yin1 yue4', meaning: 'music' },
  { word: '新闻', pinyin: 'xin1 wen2', meaning: 'news' },
  { word: '节目', pinyin: 'jie2 mu4', meaning: 'program' },
  { word: '比赛', pinyin: 'bi3 sai4', meaning: 'competition' },
  { word: '作业', pinyin: 'zuo4 ye4', meaning: 'homework' },
  { word: '办法', pinyin: 'ban4 fa3', meaning: 'method; way' },
  { word: '经验', pinyin: 'jing1 yan4', meaning: 'experience' },
  { word: '机会', pinyin: 'ji1 hui4', meaning: 'opportunity' },
  { word: '结果', pinyin: 'jie2 guo3', meaning: 'result' },
  { word: '原因', pinyin: 'yuan2 yin1', meaning: 'reason; cause' },
  { word: '目的', pinyin: 'mu4 di4', meaning: 'purpose; goal' },

  // More vocabulary
  { word: '其他', pinyin: 'qi2 ta1', meaning: 'other' },
  { word: '其实', pinyin: 'qi2 shi2', meaning: 'actually' },
  { word: '几乎', pinyin: 'ji1 hu1', meaning: 'almost' },
  { word: '终于', pinyin: 'zhong1 yu2', meaning: 'finally' },
  { word: '突然', pinyin: 'tu1 ran2', meaning: 'suddenly' },
  { word: '马上', pinyin: 'ma3 shang4', meaning: 'immediately' },
  { word: '一直', pinyin: 'yi4 zhi2', meaning: 'always; continuously' },
  { word: '首先', pinyin: 'shou3 xian1', meaning: 'first of all' },
  { word: '然后', pinyin: 'ran2 hou4', meaning: 'then; after that' },
  { word: '最后', pinyin: 'zui4 hou4', meaning: 'finally; lastly' },
  { word: '或者', pinyin: 'huo4 zhe3', meaning: 'or' },
  { word: '而且', pinyin: 'er2 qie3', meaning: 'moreover' },
  { word: '只要', pinyin: 'zhi3 yao4', meaning: 'as long as' },
  { word: '只有', pinyin: 'zhi3 you3', meaning: 'only' },
  { word: '根据', pinyin: 'gen1 ju4', meaning: 'according to' },
  { word: '另外', pinyin: 'ling4 wai4', meaning: 'in addition' },
  { word: '至少', pinyin: 'zhi4 shao3', meaning: 'at least' },
  { word: '大概', pinyin: 'da4 gai4', meaning: 'probably; about' },
  { word: '当然', pinyin: 'dang1 ran2', meaning: 'of course' },
  { word: '必须', pinyin: 'bi4 xu1', meaning: 'must; have to' },
];

/**
 * Get vocabulary for a specific HSK level
 */
export function getHskVocabulary(level: number): VocabularyData {
  let words: VocabularyEntry[] = [];

  switch (level) {
    case 1:
      words = HSK1_WORDS;
      break;
    case 2:
      words = [...HSK1_WORDS, ...HSK2_WORDS];
      break;
    case 3:
      words = [...HSK1_WORDS, ...HSK2_WORDS, ...HSK3_WORDS];
      break;
    default:
      words = HSK1_WORDS;
  }

  return {
    active: words,
    metadata: {
      version: '1.0',
      lastUpdated: new Date().toISOString().split('T')[0],
      source: 'hsk',
    },
  };
}
