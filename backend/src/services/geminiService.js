/**
 * services/geminiService.js
 * Centralised Gemini 2.0 Flash caller — single shared caller for all AI routes.
 * Each route sends its OWN isolated prompt; nothing is shared between endpoints.
 */

const API_KEY  = process.env.GEMINI_API_KEY;
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

/**
 * Call Gemini with a prompt.
 * Returns the text string, or throws on hard errors.
 * Soft errors (rate limit, no key) return a fallback string instead of throwing.
 * @param {string} prompt
 * @param {string|null} fallback - returned when Gemini is unavailable
 * @param {number} maxTokens
 */
async function callGemini(prompt, fallback = null, maxTokens = 350) {
  if (!API_KEY || API_KEY === 'your_gemini_api_key_here' || API_KEY === 'your_actual_gemini_api_key_here') {
    console.warn('[Gemini] No API key — returning fallback.');
    return fallback ?? '⚠️ Gemini API key not configured. Add GEMINI_API_KEY to backend/.env';
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: 0.7,
        },
      }),
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!res.ok) {
      const body = await res.text();
      if (res.status === 429 || res.status === 503) {
        console.warn(`[Gemini] Rate limited (${res.status}) — returning fallback.`);
        return fallback ?? '📌 Gemini is busy right now. Please try again in a moment.';
      }
      throw new Error(`Gemini error ${res.status}: ${body}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
    if (!text) throw new Error('Gemini returned empty response.');
    return text.trim();
  } catch (err) {
    if (err.name === 'TimeoutError' || err.message?.includes('abort')) {
      console.warn('[Gemini] Request timed out — returning fallback.');
      return fallback ?? '⏱️ Gemini took too long. Please try again.';
    }
    // If we have a fallback, use it; otherwise propagate error
    if (fallback) {
      console.warn(`[Gemini] Error: ${err.message} — returning fallback.`);
      return fallback;
    }
    throw err;
  }
}

module.exports = { callGemini };
