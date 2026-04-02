/**
 * services/geminiService.js
 * Centralised Gemini API caller — used by all AI routes.
 * API key is read from backend .env (never exposed to browser).
 */
const API_KEY  = process.env.GEMINI_API_KEY;
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

async function callGemini(prompt, maxTokens = 300) {
  if (!API_KEY || API_KEY === 'your_actual_gemini_api_key_here') {
    return '[Backend AI] Add GEMINI_API_KEY to backend/.env to enable live responses.';
  }

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
    }),
  });

  if (!res.ok) {
    if (res.status === 429 || res.status === 503) {
      return '📌 Gemini is rate-limited right now. The StockQuest app will show offline tips in the browser — try again in a minute, or use Learning Hub for definitions.';
    }
    throw new Error(`Gemini error ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No response.';
}

module.exports = { callGemini };
