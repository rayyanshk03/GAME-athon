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
    const { text } = await apiFetch('/ai/explain', { method: 'POST', body: JSON.stringify({ trade }) });
    return text;
  } catch {
    return '📊 The stock moved on broader sector momentum. Your timing showed good instincts — next time, confirm with RSI before placing the bet.';
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
    const buy  = pool[0] || 'MSFT';
    const watch = pool[1] || 'AAPL';
    const avoid = pool[2] || 'TSLA';
    return `📌 (Offline mode) You're holding: ${(heldSymbols||[]).join(', ') || 'nothing yet'}.\n✅ BUY: ${buy} — strong fundamentals.\n👀 WATCH: ${watch} — monitor trend before entry.\n⛔ AVOID: ${avoid} — high volatility until you have a clear edge.`;
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

// ─── Auth ────────────────────────────────────────────────────────────────────
export async function login(email, password) {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (data.token) localStorage.setItem('sq_token', data.token);
  return data;
}

export async function register(username, email, password) {
  const data = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  });
  if (data.token) localStorage.setItem('sq_token', data.token);
  return data;
}

export async function getCurrentUser() {
  const token = localStorage.getItem('sq_token');
  if (!token) return null;
  try {
    return await apiFetch('/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
  } catch {
    localStorage.removeItem('sq_token');
    return null;
  }
}

export function logout() {
  localStorage.removeItem('sq_token');
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