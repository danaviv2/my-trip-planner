const API_KEY = process.env.REACT_APP_GEMINI_API_KEY || window.env?.REACT_APP_GEMINI_API_KEY || 'AIzaSyCLuRpcz9OXh8sRk92zetsTBqwdLNkovcE';
const MODEL = 'gemini-2.0-flash-lite';
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}`;

/**
 * Convert OpenAI-style messages to Gemini format.
 * system → systemInstruction, assistant → model role
 */
function convertMessages(messages) {
  let systemInstruction = null;
  const contents = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      systemInstruction = { parts: [{ text: msg.content }] };
    } else {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }
  }

  return { systemInstruction, contents };
}

/**
 * Non-streaming call — returns full text string.
 */
export async function callOpenAI(messages, { maxTokens = 600, temperature = 0.7 } = {}) {
  if (!API_KEY) throw new Error('NO_API_KEY');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  const { systemInstruction, contents } = convertMessages(messages);
  const body = { contents, generationConfig: { maxOutputTokens: maxTokens, temperature } };
  if (systemInstruction) body.systemInstruction = systemInstruction;

  try {
    const res = await fetch(`${BASE_URL}:generateContent?key=${API_KEY}`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    clearTimeout(timeout);

    if (res.status === 429) throw new Error('RATE_LIMIT');
    if (!res.ok) throw new Error(`API_ERROR_${res.status}`);

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') throw new Error('TIMEOUT');
    throw err;
  }
}

/**
 * Streaming call — calls onChunk(accumulatedText) for each SSE token.
 * Returns an abort function.
 */
export function streamOpenAI(messages, onChunk, onDone, onError, { maxTokens = 1200, temperature = 0.7 } = {}) {
  if (!API_KEY) {
    onError(new Error('NO_API_KEY'));
    return () => {};
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  let isCancelled = false;

  const { systemInstruction, contents } = convertMessages(messages);
  const body = { contents, generationConfig: { maxOutputTokens: maxTokens, temperature } };
  if (systemInstruction) body.systemInstruction = systemInstruction;

  fetch(`${BASE_URL}:streamGenerateContent?key=${API_KEY}&alt=sse`, {
    method: 'POST',
    signal: controller.signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
    .then(async (res) => {
      clearTimeout(timeout);
      if (res.status === 429) throw new Error('RATE_LIMIT');
      if (!res.ok) throw new Error(`API_ERROR_${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done || isCancelled) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));

        for (const line of lines) {
          const json = line.slice(6).trim();
          try {
            const token = JSON.parse(json)?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            accumulated += token;
            if (token && !isCancelled) onChunk(accumulated);
          } catch (_) {}
        }
      }

      if (!isCancelled) onDone(accumulated);
    })
    .catch((err) => {
      clearTimeout(timeout);
      if (isCancelled) return;
      if (err.name === 'AbortError') onError(new Error('TIMEOUT'));
      else onError(err);
    });

  return () => {
    isCancelled = true;
    clearTimeout(timeout);
    controller.abort();
  };
}

export function getErrorMessage(err) {
  if (!err) return 'שגיאה לא ידועה';
  if (err.message === 'NO_API_KEY') return 'מפתח Gemini API לא מוגדר';
  if (err.message === 'RATE_LIMIT') return 'יותר מדי בקשות — נסה שוב בעוד שניות';
  if (err.message === 'TIMEOUT') return 'הבקשה לקחה יותר מדי זמן — נסה שוב';
  return 'שגיאת חיבור — בדוק את האינטרנט';
}
