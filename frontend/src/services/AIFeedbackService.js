/**
 * AIFeedbackService.js — Module F
 * OpenAI feature integration with offline / rate-limit safe fallbacks (no dead-end errors).
 */

import { STOCKS as DEFAULT_STOCKS } from '../data/mockData';

const API_KEY  = import.meta.env.VITE_OPENAI_API_KEY;
const ENDPOINT = API_KEY && API_KEY !== 'your_actual_openai_api_key_here'
  ? `https://api.openai.com/v1/chat/completions`
  : null;

async function callOpenAI(prompt, maxTokens = 300) {
  if (!ENDPOINT) {
    return getFallbackForPrompt(prompt);
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
    if (res.status === 429 || res.status === 503 || res.status === 408) {
      return getFallbackForPrompt(prompt);
    }
    if (res.status === 400) throw new Error('Bad request — check your prompt or API formatting.');
    if (res.status === 401) throw new Error('API key invalid or not authorized.');
    return getFallbackForPrompt(prompt);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? getFallbackForPrompt(prompt);
}

/** Curated offline answers — used when API is off, rate-limited, or errors. */
function getFallbackForPrompt(prompt) {
  const p = (prompt || '').toLowerCase();
  if (p.includes('won') || p.includes('lost')) {
    return FALLBACKS.explanation[Math.floor(Math.random() * FALLBACKS.explanation.length)];
  }
  if (p.includes('coach') || p.includes('tip') && p.includes('stats')) {
    return FALLBACKS.tip[Math.floor(Math.random() * FALLBACKS.tip.length)];
  }
  if (p.includes('stock advisor') || p.includes('recommend') || p.includes('avoid:')) {
    return getLocalStockRecommendationsFromPrompt(prompt);
  }
  if (p.includes('what is rsi') || (p.includes('rsi') && p.includes('user asks'))) {
    return CHAT_FALLBACKS.rsi;
  }
  if (p.includes('moving average') || p.includes('moving averages')) {
    return CHAT_FALLBACKS.ma;
  }
  if (p.includes('sentiment')) {
    return CHAT_FALLBACKS.sentiment;
  }
  if (p.includes('risk') || p.includes('manage')) {
    return CHAT_FALLBACKS.risk;
  }
  if (p.includes('user asks:')) {
    const q = prompt.match(/user asks:\s*"([^"]*)"/i)?.[1] || '';
    const ql = q.toLowerCase();
    if (ql.includes('rsi')) return CHAT_FALLBACKS.rsi;
    if (ql.includes('moving') || ql.includes('average')) return CHAT_FALLBACKS.ma;
    if (ql.includes('sentiment')) return CHAT_FALLBACKS.sentiment;
    if (ql.includes('risk')) return CHAT_FALLBACKS.risk;
  }
  return CHAT_FALLBACKS.default;
}

const CHAT_FALLBACKS = {
  rsi: '📊 RSI (Relative Strength Index) measures momentum from 0–100. Above 70 often means overbought; below 30 often means oversold — but always confirm with trend and volume. You\'re asking the right questions — keep learning!',
  ma: '📈 Moving averages smooth price to show trend. A short MA crossing above a longer one (e.g. 20 vs 50) can signal strength; the opposite can signal weakness. Practice spotting these on your StockQuest charts!',
  sentiment: '🧠 Market sentiment is the crowd\'s mood — bullish, bearish, or neutral — often driven by news and social data. Combine it with price action rather than using it alone. Great habit to check sentiment before you bet!',
  risk: '🛡️ Risk management means position sizing, max stake, and not chasing losses. In StockQuest, keep stakes within your max, use multipliers carefully, and review your trade history often. Discipline beats luck over time!',
  default: '💡 That\'s a solid trading question. In StockQuest, combine the chart, RSI/trend pills, and Crowd+AI before placing a bet. Check the Learning Hub for deeper lessons — you\'ve got this!',
};

const FALLBACKS = {
  explanation: [
    "📊 The stock moved on broader sector momentum. Your timing showed good instincts — next time, confirm your entry with RSI before placing the bet. Keep tracking your win rate to spot patterns!",
    "📈 Market sentiment drove this outcome. Watch for volume spikes before your next trade — high volume + price move = stronger signal. You're building great intuition!",
    "🧠 News flow influenced this move. Try cross-checking the Sentiment Panel before betting. Consistency and discipline beat luck every time!",
  ],
  tip: [
    "💡 Focus on one sector you understand well before diversifying. Specialised knowledge gives you an edge over random picks.",
    "💡 Lower your multiplier on your first few trades of the day. Warm up slowly and raise stakes as conviction grows.",
    "💡 Check the Crowd Intelligence panel before investing — when crowd + AI both agree, confidence is highest.",
  ],
};

function getLocalStockRecommendationsFromPrompt(prompt) {
  const heldMatch = prompt.match(/user holds:\s*([^.]*)/i);
  const heldRaw = heldMatch ? heldMatch[1].trim() : 'nothing yet';
  const held = heldRaw.split(',').map(s => s.trim()).filter(Boolean);
  return getLocalStockRecommendations(held, []);
}

/**
 * Zero-API stock suggestions for insights panel (always works).
 * @param {string[]} heldSymbols
 * @param {{symbol:string,sector?:string}[]} available
 */
export function getLocalStockRecommendations(heldSymbols, available) {
  const held = heldSymbols || [];
  const src = available?.length ? available : DEFAULT_STOCKS;
  const pool = src.map((s) => s.symbol);
  const avoid = pool.find((s) => !held.includes(s)) || pool[0] || 'SPY';
  const watch = pool.find((s) => s !== avoid) || pool[0] || 'MSFT';
  const buy = pool.find((s) => s !== avoid && s !== watch) || watch;
  const heldStr = held.length ? held.join(', ') : 'nothing yet';
  return [
    `📌 (Offline insights — add Gemini key for live AI.) You're tracking: ${heldStr}.`,
    `✅ BUY: ${buy} — diversified large-cap exposure; align entries with trend on the dashboard chart.`,
    `👀 WATCH: ${watch} — track volume + Crowd+AI score before sizing up.`,
    `⛔ AVOID: ${avoid} — until you have a clear edge; use smaller stakes while learning the name.`,
  ].join('\n');
}

/** Post-mortem analysis after a trade resolves. */
export async function generateTradeExplanation(trade) {
  const { symbol, direction, stake, multiplier, entryPrice, exitPrice, pointDelta, won, rsiAtEntry, trendAtEntry } = trade;
  const pct = (((exitPrice - entryPrice) / entryPrice) * 100).toFixed(2);
  const prompt = `You are a friendly trading mentor in StockQuest, a gamified simulator.
User ${won ? 'WON' : 'LOST'} a trade:
- Stock: ${symbol} | Direction: ${direction.toUpperCase()} | Entry: $${entryPrice} → Exit: $${exitPrice} (${pct}%)
- Stake: ${stake} pts × ${multiplier}x → Outcome: ${pointDelta > 0 ? '+' : ''}${pointDelta} pts
- Technicals at Entry: RSI was ${rsiAtEntry ?? '—'}, Trend was ${trendAtEntry ?? '—'}

Write 3 sentences: (1) why the stock moved and how the technicals played out, (2) what the user did right/wrong (e.g., betting against the trend, or buying overbought stock), (3) one actionable tip.
Tone: encouraging, educational, concise. Light emojis OK.`;
  return callOpenAI(prompt, 280);
}

/** Personalised improvement tip based on trade stats. */
export async function getImprovementTip(stats) {
  const prompt = `You are a trading coach for StockQuest.
User stats — Win Rate: ${stats.winRate}% | Trades: ${stats.totalTrades} | Best sector: ${stats.bestSector || 'N/A'} | Avg multiplier: ${stats.avgMultiplier}x
Give one specific actionable tip in 2 sentences. Be direct and reference their stats.`;
  return callOpenAI(prompt, 180);
}

/** Answer any trading question from the AI chatbot. */
export async function answerTradingQuestion(question) {
  const prompt = `You are an expert stock trading tutor in StockQuest.
User asks: "${question}"
Answer in 2-3 sentences. Clear, simple language. End with one encouraging phrase.`;
  return callOpenAI(prompt, 220);
}

/** Stock recommendations based on portfolio (API or local). */
export async function getStockRecommendations(heldSymbols, available) {
  const prompt = `You are an AI stock advisor for StockQuest.
User holds: ${heldSymbols.join(', ') || 'nothing yet'}.
Available: ${available.map(s => `${s.symbol}(${s.sector || 'Stock'})`).join(', ')}.
Recommend 2 to consider and 1 to avoid:
✅ BUY: [SYMBOL] — reason
✅ WATCH: [SYMBOL] — reason
⛔ AVOID: [SYMBOL] — reason
Keep each reason to one sentence.`;
  return callOpenAI(prompt, 220);
}
