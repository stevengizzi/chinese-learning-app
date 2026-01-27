/**
 * Audio Cache using IndexedDB
 *
 * Caches TTS audio blobs to avoid re-generating the same audio.
 */

import type { AudioCacheEntry } from '../../types/tts';

const DB_NAME = 'chinese-learning-audio-cache';
const DB_VERSION = 1;
const STORE_NAME = 'audio';

// Cache entries older than 30 days will be cleaned up
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Generate a cache key from request parameters
 */
function generateCacheKey(text: string, rate: number, language: string, provider: string): string {
  return `${provider}:${language}:${rate}:${text}`;
}

/**
 * Open the IndexedDB database
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open audio cache database'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
}

/**
 * Get cached audio for a request
 */
export async function getCachedAudio(
  text: string,
  rate: number,
  language: string,
  provider: string
): Promise<Blob | null> {
  try {
    const db = await openDatabase();
    const key = generateCacheKey(text, rate, language, provider);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onerror = () => {
        reject(new Error('Failed to get cached audio'));
      };

      request.onsuccess = () => {
        const entry = request.result as (AudioCacheEntry & { key: string }) | undefined;

        if (!entry) {
          resolve(null);
          return;
        }

        // Check if entry is expired
        if (Date.now() - entry.createdAt > MAX_AGE_MS) {
          // Delete expired entry
          deleteCachedAudio(text, rate, language, provider).catch(console.error);
          resolve(null);
          return;
        }

        resolve(entry.audioBlob);
      };
    });
  } catch (error) {
    console.error('Error getting cached audio:', error);
    return null;
  }
}

/**
 * Store audio in the cache
 */
export async function setCachedAudio(
  text: string,
  rate: number,
  language: string,
  provider: string,
  audioBlob: Blob
): Promise<void> {
  try {
    const db = await openDatabase();
    const key = generateCacheKey(text, rate, language, provider);

    const entry: AudioCacheEntry & { key: string } = {
      key,
      text,
      rate,
      language,
      provider,
      audioBlob,
      createdAt: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(entry);

      request.onerror = () => {
        reject(new Error('Failed to cache audio'));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  } catch (error) {
    console.error('Error caching audio:', error);
  }
}

/**
 * Delete a specific cached audio entry
 */
export async function deleteCachedAudio(
  text: string,
  rate: number,
  language: string,
  provider: string
): Promise<void> {
  try {
    const db = await openDatabase();
    const key = generateCacheKey(text, rate, language, provider);

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onerror = () => {
        reject(new Error('Failed to delete cached audio'));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  } catch (error) {
    console.error('Error deleting cached audio:', error);
  }
}

/**
 * Clean up expired cache entries
 */
export async function cleanupExpiredCache(): Promise<number> {
  try {
    const db = await openDatabase();
    const cutoff = Date.now() - MAX_AGE_MS;
    let deletedCount = 0;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('createdAt');
      const range = IDBKeyRange.upperBound(cutoff);
      const request = index.openCursor(range);

      request.onerror = () => {
        reject(new Error('Failed to clean up cache'));
      };

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;

        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          resolve(deletedCount);
        }
      };
    });
  } catch (error) {
    console.error('Error cleaning up cache:', error);
    return 0;
  }
}

/**
 * Clear all cached audio
 */
export async function clearAudioCache(): Promise<void> {
  try {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onerror = () => {
        reject(new Error('Failed to clear audio cache'));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  } catch (error) {
    console.error('Error clearing audio cache:', error);
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{ count: number; totalSize: number }> {
  try {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.openCursor();

      let count = 0;
      let totalSize = 0;

      request.onerror = () => {
        reject(new Error('Failed to get cache stats'));
      };

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;

        if (cursor) {
          count++;
          const entry = cursor.value as AudioCacheEntry & { key: string };
          totalSize += entry.audioBlob.size;
          cursor.continue();
        } else {
          resolve({ count, totalSize });
        }
      };
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return { count: 0, totalSize: 0 };
  }
}
