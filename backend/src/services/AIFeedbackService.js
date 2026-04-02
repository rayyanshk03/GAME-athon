/**
 * AIFeedbackService.js — Backend AI Service
 * OpenAI integration with offline fallbacks.
 * API key is kept on the server — never exposed to the browser.
 */

const { STOCKS: DEFAULT_STOCKS } = require('../data/mockData');

const API_KEY  = process.env.OPENAI_API_KEY;
const ENDPOINT = API_KEY && API_KEY !== 'your_actual_openai_api_key_here'
  ? 'https://api.openai.com/v1/chat/completions'
  : null;

async function callOpenAI(prompt, maxTokens = 300) {
  if (!ENDPOINT) return getFallbackForPrompt(prompt);

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    if ([429, 503, 408].includes(res.status)) return getFallbackForPrompt(prompt);
    if (res.status === 400) throw new Error('Bad request — check your prompt or API formatting.');
    if (res.status === 401) throw new Error('API key invalid or not authorized.');
    return getFallbackForPrompt(prompt);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? getFallbackForPrompt(prompt);
}

function getFallbackForPrompt(prompt) {
  const p = (prompt || '').toLowerCase();
  if (p.includes('won') || p.includes('lost'))
    return FALLBACKS.explanation[Math.floor(Math.random() * FALLBACKS.explanation.length)];
  if (p.includes('coach') || (p.includes('tip') && p.includes('stats')))
    return FALLBACKS.tip[Math.floor(Math.random() * FALLBACKS.tip.length)];
  if (p.includes('stock advisor') || p.includes('recommend') || p.includes('avoid:'))
    return getLocalStockRecommendationsFromPrompt(prompt);
  if (p.includes('rsi') && p.includes('user asks')) return CHAT_FALLBACKS.rsi;
  if (p.includes('moving average')) return CHAT_FALLBACKS.ma;
  if (p.includes('sentiment')) return CHAT_FALLBACKS.sentiment;
  if (p.includes('risk') || p.includes('manage')) return CHAT_FALLBACKS.risk;
  return CHAT_FALLBACKS.default;
}

const CHAT_FALLBACKS = {
  rsi: '📊 RSI measures momentum 0–100. Above 70 = overbought; below 30 = oversold. Always confirm with trend and volume!',
  ma:  '📈 Moving averages smooth price to show trend. Short MA crossing above long MA can signal strength. Practice spotting these on your StockQuest charts!',
  sentiment: '🧠 Market sentiment is the crowd\'s mood — bullish, bearish, or neutral. Combine it with price action rather than using it alone.',
  risk: '🛡️ Risk management means position sizing and not chasing losses. Keep stakes within your max, use multipliers carefully.',
  default: '💡 Great trading question! Combine chart, RSI, and Crowd+AI before placing a bet. Check the Learning Hub for deeper lessons.',
};

const FALLBACKS = {
  explanation: [
    '📊 The stock moved on broader sector momentum. Your timing showed good instincts — next time, confirm your entry with RSI before placing the bet.',
    '📈 Market sentiment drove this outcome. Watch for volume spikes before your next trade — high volume + price move = stronger signal.',
    '🧠 News flow influenced this move. Try cross-checking the Sentiment Panel before betting. Consistency and discipline beat luck every time!',
  ],
  tip: [
    '💡 Focus on one sector you understand well before diversifying. Specialised knowledge gives you an edge over random picks.',
    '💡 Lower your multiplier on your first few trades of the day. Warm up slowly and raise stakes as conviction grows.',
    '💡 Check the Crowd Intelligence panel before investing — when crowd + AI both agree, confidence is highest.',
  ],
};

function getLocalStockRecommendationsFromPrompt(prompt) {
  const heldMatch = prompt.match(/user holds:\s*([^.]*)/i);
  const heldRaw = heldMatch ? heldMatch[1].trim() : 'nothing yet';
  const held = heldRaw.split(',').map(s => s.trim()).filter(Boolean);
  return getLocalStockRecommendations(held, []);
}

function getLocalStockRecommendations(heldSymbols, available) {
  const held = heldSymbols || [];
  const src  = available?.length ? available : DEFAULT_STOCKS;
  const pool = src.map(s => s.symbol);
  const avoid = pool.find(s => !held.includes(s)) || pool[0] || 'SPY';
  const watch = pool.find(s => s !== avoid) || pool[0] || 'MSFT';
  const buy   = pool.find(s => s !== avoid && s !== watch) || watch;
  const heldStr = held.length ? held.join(', ') : 'nothing yet';
  return [
    `📌 (Offline insights — add OpenAI key for live AI.) You're tracking: ${heldStr}.`,
    `✅ BUY: ${buy} — diversified large-cap exposure; align entries with trend on the dashboard chart.`,
    `👀 WATCH: ${watch} — track volume + Crowd+AI score before sizing up.`,
    `⛔ AVOID: ${avoid} — until you have a clear edge; use smaller stakes while learning the name.`,
  ].join('\n');
}

module.exports = { callOpenAI, getLocalStockRecommendations };
