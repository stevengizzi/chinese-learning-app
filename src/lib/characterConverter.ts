/**
 * Character Set Converter
 *
 * Uses opencc-js for context-aware simplified-to-traditional Chinese conversion.
 * Handles one-to-many mappings (e.g., 发 → 發 in 发展 vs 髮 in 头发).
 */

import * as OpenCC from 'opencc-js';

export type CharacterSet = 'simplified' | 'traditional';

const CHAR_SET_KEY = 'preferred-character-set';

// Create converter once (eager initialization is fine — module is loaded only when traditional is first used)
let s2tConverter: ((text: string) => string) | undefined;

function getConverter(): (text: string) => string {
  if (!s2tConverter) {
    s2tConverter = OpenCC.Converter({ from: 'cn', to: 'tw' });
  }
  return s2tConverter;
}

/**
 * Convert simplified Chinese text to traditional
 */
export function toTraditional(simplified: string): string {
  return getConverter()(simplified);
}

/**
 * Convert text based on the selected character set
 */
export function convertCharacters(text: string, characterSet: CharacterSet): string {
  if (characterSet === 'traditional') {
    return toTraditional(text);
  }
  return text;
}

/**
 * Load the user's preferred character set from localStorage
 */
export function loadCharacterSetPreference(): CharacterSet {
  try {
    const saved = localStorage.getItem(CHAR_SET_KEY);
    if (saved === 'traditional' || saved === 'simplified') {
      return saved;
    }
  } catch {
    // Ignore errors
  }
  return 'simplified';
}

/**
 * Save the user's preferred character set to localStorage
 */
export function saveCharacterSetPreference(characterSet: CharacterSet): void {
  try {
    localStorage.setItem(CHAR_SET_KEY, characterSet);
  } catch {
    // Ignore errors
  }
}
