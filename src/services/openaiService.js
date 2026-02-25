const API_KEY = process.env.REACT_APP_OPENAI_API_KEY || '';
const ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini';

/**
 * Non-streaming call — returns full text string.
 */
export async function callOpenAI(messages, { maxTokens = 600, temperature = 0.7 } = {}) {
  if (!API_KEY) throw new Error('NO_API_KEY');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({ model: MODEL, messages, max_tokens: maxTokens, temperature }),
    });

    clearTimeout(timeout);

    if (res.status === 429) throw new Error('RATE_LIMIT');
    if (!res.ok) throw new Error(`API_ERROR_${res.status}`);

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
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

  fetch(ENDPOINT, {
    method: 'POST',
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ model: MODEL, messages, max_tokens: maxTokens, temperature, stream: true }),
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
          if (json === '[DONE]') {
            if (!isCancelled) onDone(accumulated);
            return;
          }
          try {
            const token = JSON.parse(json)?.choices?.[0]?.delta?.content || '';
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
  if (err.message === 'NO_API_KEY') return 'מפתח API לא מוגדר';
  if (err.message === 'RATE_LIMIT') return 'יותר מדי בקשות — נסה שוב בעוד שניות';
  if (err.message === 'TIMEOUT') return 'הבקשה לקחה יותר מדי זמן — נסה שוב';
  return 'שגיאת חיבור — בדוק את האינטרנט';
}
