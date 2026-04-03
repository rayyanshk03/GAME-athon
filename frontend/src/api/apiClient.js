/**
 * apiClient.js — Frontend ↔ Backend Bridge
 *
 * ─── HOW TO CHANGE THE BACKEND URL ─────────────────────────────────────────
 * In development: Vite proxies /api → http://localhost:3001 (see vite.config.js)
 * In production:  Set VITE_API_URL in your .env file to your deployed backend:
 *                 VITE_API_URL=https://your-backend.onrender.com/api
 * ────────────────────────────────────────────────────────────────────────────
 *
 * API routes covered:
 *   GET              /api/health
 *   GET/POST/DELETE  /api/store/:key
 *   POST             /api/ai/explain | /tip | /chat | /recommend
 *   GET              /api/stocks
 *   GET              /api/stocks/:symbol
 *   GET              /api/stocks/:symbol/history?days=N
 *   GET              /api/stocks/:symbol/news?days=N
 *   POST             /api/engine/outcome | /validate-bet | /backtest | etc.
 */

// ── ONE LINE TO CHANGE FOR PRODUCTION ────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_URL || '/api';
// ─────────────────────────────────────────────────────────────────────────────

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json();
}

// ─── Health ───────────────────────────────────────────────────────────────────
export async function checkBackendHealth() {
  try {
    const data = await apiFetch('/health');
    return { online: true, ...data };
  } catch {
    return { online: false };
  }
}

export async function getConnectionStatus() {
  const health = await checkBackendHealth();
  return {
    backendOnline: health.online,
    message: health.online
      ? `✅ Backend connected (v${health.version})`
      : '⚠️ Backend offline — start your Express server',
  };
}

// ─── Storage ──────────────────────────────────────────────────────────────────
export async function storeGet(key) {
  try {
    const { found, value } = await apiFetch(`/store/${key}`);
    return found ? value : null;
  } catch {
    try { return JSON.parse(localStorage.getItem(`sq_${key}`)); } catch { return null; }
  }
}

export async function storeSet(key, value) {
  try {
    await apiFetch(`/store/${key}`, { method: 'POST', body: JSON.stringify({ value }) });
  } catch {
    localStorage.setItem(`sq_${key}`, JSON.stringify(value));
  }
}

export async function storeDelete(key) {
  try {
    await apiFetch(`/store/${key}`, { method: 'DELETE' });
  } catch {
    localStorage.removeItem(`sq_${key}`);
  }
}

// ─── AI ───────────────────────────────────────────────────────────────────────
export async function explainTrade(trade) {
  try {
    // Send the full trade object so the backend can compute hold duration,
    // sector context, risk rating, and outcome quality for the detailed analysis.
    const { text } = await apiFetch('/ai/explain', {
      method: 'POST',
      body: JSON.stringify({ trade: {
        symbol:      trade.symbol,
        direction:   trade.direction,
        stake:       trade.stake,
        multiplier:  trade.multiplier,
        entryPrice:  trade.entryPrice,
        exitPrice:   trade.exitPrice,
        pointDelta:  trade.pointDelta,
        won:         trade.won,
        sector:      trade.sector ?? 'Equity',
        placedAt:    trade.placedAt,
        resolvedAt:  trade.resolvedAt,
      }}),
    });
    return text;
  } catch {
    const pct = trade.entryPrice && trade.exitPrice
      ? (((trade.exitPrice - trade.entryPrice) / trade.entryPrice) * 100).toFixed(2)
      : '?';
    return `## 📊 Market Context\n${trade.symbol} moved ${pct}% during your hold period, likely driven by broader ${trade.sector ?? 'market'} sector momentum.\n\n## ${trade.won ? '✅' : '❌'} Decision Quality\nYour ${(trade.direction || 'position').toUpperCase()} call ${trade.won ? 'was timely and well-executed' : 'did not align with the prevailing market direction this session'}.\n\n## ⚖️ Risk Assessment\nStake: ${trade.stake} pts × ${trade.multiplier}× — Risk level: ${trade.multiplier >= 3 ? 'HIGH' : trade.multiplier === 2 ? 'MEDIUM' : 'LOW'}.\n\n## 🔍 Key Insight\nAlways confirm your entry with RSI and trend alignment before committing stake.\n\n## 🎯 Action Plan\n1. Review ${trade.symbol} hourly chart for better entry signals.\n2. Use 1× multiplier until win rate on this stock crosses 55%.\n3. Check sector ETF direction before your next ${trade.sector ?? 'sector'} trade.`;
  }
}

export async function getImprovementTip(stats) {
  try {
    const { text } = await apiFetch('/ai/tip', { method: 'POST', body: JSON.stringify({ stats }) });
    return text;
  } catch {
    return '💡 Focus on one sector you understand well before diversifying. Specialised knowledge gives you an edge over random picks.';
  }
}

export async function askChatbot(question) {
  try {
    const { text } = await apiFetch('/ai/chat', { method: 'POST', body: JSON.stringify({ question }) });
    return text;
  } catch {
    return '💡 Great question! Combine the chart, RSI/trend signals, and Crowd+AI score before placing a bet. Check the Learning Hub for deeper lessons.';
  }
}

export async function getRecommendations(heldSymbols, available) {
  try {
    const { text } = await apiFetch('/ai/recommend', { method: 'POST', body: JSON.stringify({ heldSymbols, available }) });
    return text;
  } catch {
    const pool = (available || []).map(s => s.symbol);
    const buy = pool[0] || 'MSFT';
    const watch = pool[1] || 'AAPL';
    const avoid = pool[2] || 'TSLA';
    return `📌 (Offline mode) You're holding: ${(heldSymbols || []).join(', ') || 'nothing yet'}.\n✅ BUY: ${buy} — strong fundamentals.\n👀 WATCH: ${watch} — monitor trend before entry.\n⛔ AVOID: ${avoid} — high volatility until you have a clear edge.`;
  }
}

export async function getRealSentiment(articles, symbol) {
  try {
    const { sentiments } = await apiFetch('/ai/sentiment', { method: 'POST', body: JSON.stringify({ articles, symbol }) });
    return sentiments;
  } catch {
    return [];
  }
}

export async function getStockInsight(symbol, data) {
  try {
    const { text } = await apiFetch('/ai/insight', { method: 'POST', body: JSON.stringify({ symbol, ...data }) });
    return text;
  } catch {
    return '⚖️ Mixed technicals. Wait for a clearer momentum shift before taking a large position.';
  }
}

// ─── Stocks ───────────────────────────────────────────────────────────────────
export async function fetchAllStocks() {
  return await apiFetch('/stocks');
}

export async function fetchStock(symbol) {
  return await apiFetch(`/stocks/${symbol}`);
}

export async function fetchStockHistory(symbol, days = 7) {
  const data = await apiFetch(`/stocks/${symbol}/history?days=${days}`);
  return data.history ?? data;
}

export async function getCompanyNews(symbol, days = 7) {
  try {
    return await apiFetch(`/stocks/${symbol}/news?days=${days}`);
  } catch {
    return [];
  }
}

// ─── Engines ─────────────────────────────────────────── (optional — use for server-side calculations)
export async function engineCalculateOutcome(params) {
  return await apiFetch('/engine/outcome', { method: 'POST', body: JSON.stringify(params) });
}

export async function engineValidateBet(params) {
  return await apiFetch('/engine/validate-bet', { method: 'POST', body: JSON.stringify(params) });
}

export async function engineRunBacktest(priceHistory, options) {
  return await apiFetch('/engine/backtest', { method: 'POST', body: JSON.stringify({ priceHistory, options }) });
}

export async function engineGetDailyQuests() {
  return await apiFetch('/engine/daily-quests');
}