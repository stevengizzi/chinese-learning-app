/**
 * Question Particle Corpus Parser
 *
 * Parses the interrogative_particles.txt corpus file into QuestionParticleItem objects.
 * For 吗/呢/吧 particle practice (different from interrogative words like 什么/谁).
 */

import type { InterrogativeItem, InterrogativeParticle } from '../types/interrogativeParticle';

/**
 * Map from corpus particle type names to InterrogativeParticle
 */
const PARTICLE_TYPE_MAP: Record<string, InterrogativeParticle> = {
  'MA': '吗',
  'NE': '呢',
  'BA': '吧',
};

/**
 * Parses the question particle corpus file into InterrogativeItem objects.
 *
 * Expected format:
 * PARTICLE: MA
 * INSTRUCTION: Turn into a yes/no question using 吗
 * STATEMENT_CN: 他是学生
 * STATEMENT_EN: He is a student
 * QUESTION_CN: 他是学生吗？
 * QUESTION_EN: Is he a student?
 * PINYIN: ta1 shi4 xue2 sheng ma
 * ===
 */
export function parseQuestionParticleCorpus(content: string): InterrogativeItem[] {
  const items: InterrogativeItem[] = [];
  const lines = content.split('\n');

  let currentParticle: InterrogativeParticle | null = null;
  let currentInstruction: string | null = null;
  let currentStatementCN: string | null = null;
  let currentStatementEN: string | null = null;
  let currentQuestionCN: string | null = null;
  let currentQuestionEN: string | null = null;
  let currentPinyin: string | null = null;
  let itemIndex = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (trimmed.startsWith('#') || trimmed === '') {
      continue;
    }

    // Block separator - save item if we have all required fields
    if (trimmed === '===') {
      if (currentParticle && currentInstruction && currentStatementCN &&
          currentStatementEN && currentQuestionCN && currentQuestionEN && currentPinyin) {
        items.push({
          id: `qp_${String(itemIndex).padStart(3, '0')}`,
          particle: currentParticle,
          instruction: currentInstruction,
          statementChinese: currentStatementCN,
          statementEnglish: currentStatementEN,
          questionChinese: currentQuestionCN,
          questionEnglish: currentQuestionEN,
          pinyin: currentPinyin,
        });
        itemIndex++;
      }
      // Reset for next block
      currentParticle = null;
      currentInstruction = null;
      currentStatementCN = null;
      currentStatementEN = null;
      currentQuestionCN = null;
      currentQuestionEN = null;
      currentPinyin = null;
      continue;
    }

    // Parse lines
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;

    const key = trimmed.substring(0, colonIndex).trim();
    const value = trimmed.substring(colonIndex + 1).trim();

    switch (key) {
      case 'PARTICLE':
        currentParticle = PARTICLE_TYPE_MAP[value] || null;
        break;
      case 'INSTRUCTION':
        currentInstruction = value;
        break;
      case 'STATEMENT_CN':
        currentStatementCN = value;
        break;
      case 'STATEMENT_EN':
        currentStatementEN = value;
        break;
      case 'QUESTION_CN':
        currentQuestionCN = value;
        break;
      case 'QUESTION_EN':
        currentQuestionEN = value;
        break;
      case 'PINYIN':
        currentPinyin = value;
        break;
    }
  }

  return items;
}

/**
 * Loads question particle items from the corpus file.
 */
export async function loadQuestionParticleItems(): Promise<InterrogativeItem[]> {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}docs/interrogative_particles.txt`);
    if (!response.ok) {
      console.warn('Question particle corpus not found');
      return [];
    }
    const content = await response.text();
    return parseQuestionParticleCorpus(content);
  } catch (error) {
    console.error('Failed to load question particle corpus:', error);
    return [];
  }
}

/**
 * Filters items by selected particles.
 */
export function filterByParticles(
  items: InterrogativeItem[],
  selectedParticles: InterrogativeParticle[]
): InterrogativeItem[] {
  if (selectedParticles.length === 0) {
    return items;
  }
  return items.filter(item => selectedParticles.includes(item.particle));
}

/**
 * Shuffles an array using Fisher-Yates algorithm.
 */
export function shuffleItems<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get count of items per particle type.
 */
export function getCountsByParticle(
  items: InterrogativeItem[]
): Record<InterrogativeParticle, number> {
  const counts: Record<string, number> = {
    '吗': 0,
    '呢': 0,
    '吧': 0,
  };

  for (const item of items) {
    counts[item.particle] = (counts[item.particle] || 0) + 1;
  }

  return counts as Record<InterrogativeParticle, number>;
}

/**
 * Grades a user's answer for a question particle item.
 * Returns true if the answer is correct (exact match or close enough).
 */
export function gradeQuestionParticleAnswer(
  userAnswer: string,
  correctAnswer: string
): { isCorrect: boolean; feedback?: string } {
  // Normalize both answers (remove extra spaces, handle punctuation)
  const normalizedUser = userAnswer.trim()
    .replace(/\s+/g, '')
    .replace(/[!！]/g, '！')
    .replace(/[?？]/g, '？');
  const normalizedCorrect = correctAnswer.trim()
    .replace(/\s+/g, '')
    .replace(/[!！]/g, '！')
    .replace(/[?？]/g, '？');

  // Exact match
  if (normalizedUser === normalizedCorrect) {
    return { isCorrect: true };
  }

  // Check without punctuation
  const userNoPunct = normalizedUser.replace(/[？！。，]/g, '');
  const correctNoPunct = normalizedCorrect.replace(/[？！。，]/g, '');

  if (userNoPunct === correctNoPunct) {
    return { isCorrect: true }; // Accept without exact punctuation match
  }

  // Check if they used the wrong particle
  const particles = ['吗', '呢', '吧'];
  const correctParticle = particles.find(p => normalizedCorrect.includes(p));
  const usedParticle = particles.find(p => normalizedUser.includes(p));

  if (correctParticle && usedParticle && correctParticle !== usedParticle) {
    return {
      isCorrect: false,
      feedback: `You used ${usedParticle} but should use ${correctParticle}`,
    };
  }

  if (correctParticle && !usedParticle) {
    return {
      isCorrect: false,
      feedback: `Missing particle: ${correctParticle}`,
    };
  }

  return { isCorrect: false };
}
