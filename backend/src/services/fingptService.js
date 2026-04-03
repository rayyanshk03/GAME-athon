/**
 * services/fingptService.js
 *
 * Proxy to the FinGPT RAG model running via ngrok.
 * Tries several common endpoint/payload patterns since the exact API
 * schema may vary by FinGPT version (FastAPI, Flask, Gradio, etc.).
 *
 * Priority order:
 *   1. POST /query    { query }
 *   2. POST /chat     { message }
 *   3. POST /ask      { question }
 *   4. POST /predict  { text }
 *   5. POST /         { query }   (bare root)
 */

const BASE = (process.env.FINGPT_API_URL || '').replace(/\/$/, '');

// Candidate endpoint formats — tried in order until one succeeds
const CANDIDATES = [
  { path: '/query',   body: (q) => ({ query: q }) },
  { path: '/chat',    body: (q) => ({ message: q }) },
  { path: '/ask',     body: (q) => ({ question: q }) },
  { path: '/predict', body: (q) => ({ text: q }) },
  { path: '/',        body: (q) => ({ query: q }) },
];

/**
 * Extract the answer text from a variety of possible response shapes:
 *   { answer: "..." }
 *   { response: "..." }
 *   { text: "..." }
 *   { output: "..." }
 *   { result: "..." }
 *   { message: "..." }
 *   "plain string"
 */
function extractText(data) {
  if (typeof data === 'string') return data.trim();
  const candidates = ['answer', 'response', 'text', 'output', 'result', 'message', 'content'];
  for (const key of candidates) {
    if (data[key] && typeof data[key] === 'string') return data[key].trim();
  }
  // Last resort: stringify
  return JSON.stringify(data);
}

/**
 * Calls the FinGPT RAG API with the given question.
 * Returns the answer string, or throws if all endpoints fail.
 */
async function askFinGPT(question) {
  if (!BASE) throw new Error('FINGPT_API_URL not set');

  let lastError = null;

  for (const { path, body } of CANDIDATES) {
    const url = `${BASE}${path}`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // ngrok requires this header to bypass the browser warning
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(body(question)),
        signal: AbortSignal.timeout(15_000), // 15s timeout
      });

      if (!res.ok) {
        lastError = new Error(`${url} → HTTP ${res.status}`);
        continue; // try next candidate
      }

      const contentType = res.headers.get('content-type') || '';
      let data;
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        data = await res.text();
      }

      const text = extractText(data);
      if (text && text.length > 3) return text; // success
      lastError = new Error(`${url} returned empty response`);
    } catch (err) {
      lastError = err;
      // network error or timeout — try next
    }
  }

  throw lastError || new Error('All FinGPT endpoints failed');
}

module.exports = { askFinGPT };
