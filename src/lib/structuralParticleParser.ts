/**
 * Structural Particle Corpus Parser
 *
 * Parses the structural_particles.txt corpus file into StructuralParticleItem objects.
 */

import type { StructuralParticleItem, StructuralParticle } from '../types/structuralParticle';

/**
 * Map from corpus particle type names to StructuralParticle
 */
const PARTICLE_TYPE_MAP: Record<string, StructuralParticle> = {
  'DE_ATTR': '的',
  'DE_ADV': '地',
  'DE_COMP': '得',
};

/**
 * Parses the structural particle corpus file into StructuralParticleItem objects.
 *
 * Expected format:
 * PARTICLE: DE_ATTR
 * INSTRUCTION: Use 的 to describe the noun with the adjective
 * BASE: 漂亮 + 花
 * HINT: beautiful flower
 * ANSWER: 漂亮的花 | piao4 liang de hua1
 * ===
 */
export function parseStructuralParticleCorpus(content: string): StructuralParticleItem[] {
  const items: StructuralParticleItem[] = [];
  const lines = content.split('\n');

  let currentParticle: StructuralParticle | null = null;
  let currentInstruction: string | null = null;
  let currentBase: string | null = null;
  let currentHint: string | null = null;
  let itemIndex = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (trimmed.startsWith('#') || trimmed === '') {
      continue;
    }

    // Block separator - save item if we have all required fields
    if (trimmed === '===') {
      if (currentParticle && currentInstruction && currentBase && currentHint) {
        // We need to wait for the ANSWER line before creating the item
      }
      // Reset for next block (particle persists from previous line parsing)
      currentParticle = null;
      currentInstruction = null;
      currentBase = null;
      currentHint = null;
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
      case 'BASE':
        currentBase = value;
        break;
      case 'HINT':
        currentHint = value;
        break;
      case 'ANSWER':
        if (currentParticle && currentInstruction && currentBase && currentHint) {
          const parts = value.split('|').map(p => p.trim());
          if (parts.length === 2) {
            const [chineseAnswer, pinyin] = parts;
            items.push({
              id: `sp_${String(itemIndex).padStart(3, '0')}`,
              particle: currentParticle,
              instruction: currentInstruction,
              baseElements: currentBase,
              englishHint: currentHint,
              chineseAnswer,
              pinyin,
            });
            itemIndex++;
          }
        }
        break;
    }
  }

  return items;
}

/**
 * Loads structural particle items from the corpus file.
 */
export async function loadStructuralParticleItems(): Promise<StructuralParticleItem[]> {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}docs/structural_particles.txt`);
    if (!response.ok) {
      console.warn('Structural particle corpus not found');
      return [];
    }
    const content = await response.text();
    return parseStructuralParticleCorpus(content);
  } catch (error) {
    console.error('Failed to load structural particle corpus:', error);
    return [];
  }
}

/**
 * Filters items by selected particles.
 */
export function filterByParticles(
  items: StructuralParticleItem[],
  selectedParticles: StructuralParticle[]
): StructuralParticleItem[] {
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
  items: StructuralParticleItem[]
): Record<StructuralParticle, number> {
  const counts: Record<string, number> = {
    '的': 0,
    '地': 0,
    '得': 0,
  };

  for (const item of items) {
    counts[item.particle] = (counts[item.particle] || 0) + 1;
  }

  return counts as Record<StructuralParticle, number>;
}

/**
 * Grades a user's answer for a structural particle item.
 * Returns true if the answer is correct (exact match or close enough).
 */
export function gradeStructuralParticleAnswer(
  userAnswer: string,
  correctAnswer: string
): { isCorrect: boolean; feedback?: string } {
  // Normalize both answers (remove extra spaces)
  const normalizedUser = userAnswer.trim().replace(/\s+/g, '');
  const normalizedCorrect = correctAnswer.trim().replace(/\s+/g, '');

  // Exact match
  if (normalizedUser === normalizedCorrect) {
    return { isCorrect: true };
  }

  // Check if they used the wrong particle
  const particles = ['的', '地', '得'];
  for (const particle of particles) {
    if (normalizedCorrect.includes(particle) && !normalizedUser.includes(particle)) {
      // Find which particle the user used instead
      const usedParticle = particles.find(p => normalizedUser.includes(p));
      if (usedParticle) {
        return {
          isCorrect: false,
          feedback: `You used ${usedParticle} but should use ${particle}`,
        };
      } else {
        return {
          isCorrect: false,
          feedback: `Missing particle: ${particle}`,
        };
      }
    }
  }

  return { isCorrect: false };
}
