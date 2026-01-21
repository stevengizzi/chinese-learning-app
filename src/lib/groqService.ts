/**
 * Groq API service for translation feedback.
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const API_KEY_STORAGE_KEY = 'groq-api-key';

export function getGroqApiKey(): string | null {
  return localStorage.getItem(API_KEY_STORAGE_KEY);
}

export function setGroqApiKey(key: string): void {
  localStorage.setItem(API_KEY_STORAGE_KEY, key);
}

export function clearGroqApiKey(): void {
  localStorage.removeItem(API_KEY_STORAGE_KEY);
}

export interface TranslationFeedbackRequest {
  hanzi: string;
  pinyin: string;
  userTranslation: string;
  referenceTranslations: string[];
}

export interface TranslationFeedbackResponse {
  isCorrect: boolean;
  feedback: string;
  error?: string;
}

export async function getTranslationFeedback(
  request: TranslationFeedbackRequest
): Promise<TranslationFeedbackResponse> {
  const apiKey = getGroqApiKey();

  if (!apiKey) {
    return {
      isCorrect: false,
      feedback: '',
      error: 'No API key configured. Please set your Groq API key in settings.',
    };
  }

  const prompt = `You are a Chinese language learning assistant. Compare the user's English translation to the original Chinese sentence and reference translations.

Chinese sentence: ${request.hanzi}
Pinyin: ${request.pinyin}
Reference translations: ${request.referenceTranslations.join(' | ')}
User's translation: "${request.userTranslation}"

Evaluate if the user's translation correctly conveys the meaning of the Chinese sentence. Consider:
1. Is the core meaning preserved?
2. Are minor differences in tense/aspect acceptable? (Chinese often doesn't mark these explicitly)
3. Are word choice variations acceptable if meaning is the same?

Respond in this exact format:
CORRECT: [yes/no]
FEEDBACK: [1-2 sentences explaining why the translation is correct or what's wrong/missing]`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 200,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        return {
          isCorrect: false,
          feedback: '',
          error: 'Invalid API key. Please check your Groq API key.',
        };
      }
      return {
        isCorrect: false,
        feedback: '',
        error: `API error: ${errorData.error?.message || response.statusText}`,
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse the response
    const correctMatch = content.match(/CORRECT:\s*(yes|no)/i);
    const feedbackMatch = content.match(/FEEDBACK:\s*(.+)/is);

    const isCorrect = correctMatch?.[1]?.toLowerCase() === 'yes';
    const feedback = feedbackMatch?.[1]?.trim() || content;

    return {
      isCorrect,
      feedback,
    };
  } catch (error) {
    return {
      isCorrect: false,
      feedback: '',
      error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
