/**
 * ApiService.js — Frontend ↔ Backend Bridge
 *
 * This is the single file that connects the React frontend to the
 * Express backend. Every backend endpoint has a matching function here.
 *
 * How it works:
 *  - All calls go to /api/* (Vite proxies them to http://localhost:3001)
 *  - Every function has an automatic fallback so the app keeps working
 *    even if the backend is not running (falls back to localStorage / in-browser AI)
 *
 * Backend routes covered:
 *  GET/POST/DELETE  /api/store/:key       → StorageService replacement
 *  POST             /api/ai/explain       → Trade post-mortem
 *  POST             /api/ai/tip           → Personalised improvement tip
 *  POST             /api/ai/chat          → AI chatbot answer
 *  POST             /api/ai/recommend     → Stock recommendations
 *  GET              /api/stocks           → All stocks
 *  GET              /api/stocks/:symbol   → Single stock
 *  GET              /api/stocks/:symbol/history?days=7  → Price history
 *  GET              /api/health           → Backend health check
 */

const BASE_URL = '/api';   // Vite proxy forwards /api → http://localhost:3001

// ─────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json();
}

// ─────────────────────────────────────────────────────────
// 1. Health Check — tells you if the backend is running
// ─────────────────────────────────────────────────────────
export async function checkBackendHealth() {
  try {
    const data = await apiFetch('/health');
    return { online: true, ...data };
  } catch {
    return { online: false };
  }
}

// ─────────────────────────────────────────────────────────
// 2. Storage API — replaces localStorage via backend
//    Fallback: uses localStorage directly if backend is down
// ─────────────────────────────────────────────────────────
export async function storeGet(key) {
  try {
    const { found, value } = await apiFetch(`/store/${key}`);
    return found ? value : null;
  } catch {
    // Fallback to localStorage
    try { return JSON.parse(localStorage.getItem(`sq_${key}`)); } catch { return null; }
  }
}

export async function storeSet(key, value) {
  try {
    await apiFetch(`/store/${key}`, {
      method:  'POST',
      body:    JSON.stringify({ value }),
    });
  } catch {
    // Fallback to localStorage
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

// ─────────────────────────────────────────────────────────
// 3. AI Endpoints — server-side Gemini (API key stays on server)
//    Fallback: calls Gemini directly from browser using VITE key
// ─────────────────────────────────────────────────────────

/** Explain why a trade won or lost */
export async function explainTrade(trade) {
  try {
    const { text } = await apiFetch('/ai/explain', {
      method: 'POST',
      body:   JSON.stringify({ trade }),
    });
    return text;
  } catch {
    // Fallback — import browser-side AI if backend offline
    const { generateTradeExplanation } = await import('./AIFeedbackService');
    return generateTradeExplanation(trade);
  }
}

/** Get a personalised improvement tip based on user stats */
export async function getImprovementTip(stats) {
  try {
    const { text } = await apiFetch('/ai/tip', {
      method: 'POST',
      body:   JSON.stringify({ stats }),
    });
    return text;
  } catch {
    const { getImprovementTip: localTip } = await import('./AIFeedbackService');
    return localTip(stats);
  }
}

/** Answer a user's trading question (chatbot) */
export async function askChatbot(question) {
  try {
    const { text } = await apiFetch('/ai/chat', {
      method: 'POST',
      body:   JSON.stringify({ question }),
    });
    return text;
  } catch {
    const { answerTradingQuestion } = await import('./AIFeedbackService');
    return answerTradingQuestion(question);
  }
}

/** Get AI stock recommendations based on held positions */
export async function getRecommendations(heldSymbols, available) {
  try {
    const { text } = await apiFetch('/ai/recommend', {
      method: 'POST',
      body:   JSON.stringify({ heldSymbols, available }),
    });
    return text;
  } catch {
    const { getLocalStockRecommendations } = await import('./AIFeedbackService');
    return getLocalStockRecommendations(heldSymbols, available);
  }
}

// ─────────────────────────────────────────────────────────
// 4. Stock Data Endpoints
//    Fallback: returns mock data from mockData.js
// ─────────────────────────────────────────────────────────

/** Fetch all stocks */
export async function fetchAllStocks() {
  try {
    return await apiFetch('/stocks');
  } catch {
    const { STOCKS } = await import('../data/mockData');
    return STOCKS;
  }
}

/** Fetch a single stock by symbol */
export async function fetchStock(symbol) {
  try {
    return await apiFetch(`/stocks/${symbol}`);
  } catch {
    const { STOCKS } = await import('../data/mockData');
    return STOCKS.find(s => s.symbol === symbol) || null;
  }
}

/** Fetch price history for a stock (default 7 days) */
export async function fetchStockHistory(symbol, days = 7) {
  try {
    const data = await apiFetch(`/stocks/${symbol}/history?days=${days}`);
    return data.history;
  } catch {
    const { generateHistoricalData, STOCKS } = await import('../data/mockData');
    const stock = STOCKS.find(s => s.symbol === symbol);
    return generateHistoricalData(stock?.price || 100);
  }
}

// ─────────────────────────────────────────────────────────
// 5. Status Banner Helper
//    Use this in any component to show "Backend: Online/Offline"
// ─────────────────────────────────────────────────────────
export async function getConnectionStatus() {
  const health = await checkBackendHealth();
  return {
    backendOnline: health.online,
    message: health.online
      ? `✅ Backend connected (v${health.version})`
      : '⚠️ Backend offline — running in local mode',
  };
}
