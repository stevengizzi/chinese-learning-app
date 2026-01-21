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

  const prompt = `
You are a lenient Chinese language learning assistant evaluating English translations.

Chinese sentence: ${request.hanzi}
Pinyin: ${request.pinyin}
Reference translations: ${request.referenceTranslations.join(' | ')}
User's translation: "${request.userTranslation}"

IMPORTANT GRADING RULES - BE VERY LENIENT:

1. TENSE & ASPECT ARE FLEXIBLE:
Chinese does not mark tense or aspect. Accept ANY reasonable English tense or aspect:
- present, past, future
- progressive, habitual, perfect
Do NOT penalize for differences like "I watch" vs "I'm watching".

2. IGNORE PRAGMATIC NUANCE:
Do NOT penalize for differences in:
- general vs specific
- habitual vs one-time
- ongoing vs neutral
If the core action is the same, it is correct.

3. WORD CHOICE:
Accept synonyms and equivalent expressions.
Examples:
"return home" = "go back home" = "go home"
"watch" = "see" (for movies/TV)

4. STYLE:
Accept natural English even if word order or phrasing differs from Chinese.

5. ONLY MARK INCORRECT IF:
The translation changes the core meaning:
- wrong subject or object
- wrong main verb/action
- missing or added key semantic content

Respond in this exact format:
CORRECT: [yes/no]
FEEDBACK: [1-2 sentences. If correct, briefly affirm. If incorrect, explain what core meaning was wrong or missing.]
`;

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
