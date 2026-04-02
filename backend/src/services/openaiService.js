/**
 * services/openaiService.js
 * Centralised OpenAI API caller — used by all AI routes.
 * API key is read from backend .env (never exposed to browser).
 */
const API_KEY  = process.env.OPENAI_API_KEY;
const ENDPOINT = `https://api.openai.com/v1/chat/completions`;

async function callOpenAI(prompt, maxTokens = 300) {
  if (!API_KEY || API_KEY === 'your_actual_openai_api_key_here') {
    return '[Backend AI] Add OPENAI_API_KEY to backend/.env to enable live responses.';
  }

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.7
    }),
  });

  if (!res.ok) {
    if (res.status === 429 || res.status === 503) {
      return '📌 OpenAI is rate-limited right now. The StockQuest app will show offline tips in the browser — try again in a minute, or use Learning Hub for definitions.';
    }
    throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? 'No response.';
}

module.exports = { callOpenAI };
