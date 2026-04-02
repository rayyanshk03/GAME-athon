// ============================================================
//  MarketPulse — Finnhub API Layer  (finnhub.js)
// ============================================================

'use strict';

const FINNHUB_KEY = 'd77b3cpr01qp6afkvi80d77b3cpr01qp6afkvi8g';
const BASE        = 'https://finnhub.io/api/v1';

// ── Rate-limit-safe fetch (adds delay between calls) ─────────
let _lastCallTime = 0;
async function apiFetch(url) {
  const now = Date.now();
  const elapsed = now - _lastCallTime;
  if (elapsed < 200) await sleep(200 - elapsed); // max ~5 req/sec
  _lastCallTime = Date.now();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Quote (current price, change, OHLC) ─────────────────────
// Returns: { c: price, d: change, dp: changePct, h, l, o, pc }
async function fetchQuote(ticker) {
  return apiFetch(`${BASE}/quote?symbol=${ticker}&token=${FINNHUB_KEY}`);
}

// ── Candle data for chart ─────────────────────────────────────
// resolution: '1','5','15','30','60','D','W','M'
// from/to: Unix seconds
async function fetchCandles(ticker, resolution, fromTs, toTs) {
  return apiFetch(
    `${BASE}/stock/candle?symbol=${ticker}&resolution=${resolution}&from=${fromTs}&to=${toTs}&token=${FINNHUB_KEY}`
  );
}

// ── Company news ─────────────────────────────────────────────
async function fetchCompanyNews(ticker) {
  const to   = new Date().toISOString().split('T')[0];
  const from = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  return apiFetch(
    `${BASE}/company-news?symbol=${ticker}&from=${from}&to=${to}&token=${FINNHUB_KEY}`
  );
}

// ── Company profile ─────────────────────────────────────────
async function fetchProfile(ticker) {
  return apiFetch(`${BASE}/stock/profile2?symbol=${ticker}&token=${FINNHUB_KEY}`);
}

// ── Fetch all sidebar quotes ─────────────────────────────────
window.refreshAllQuotes = async function () {
  for (const s of window.STOCKS) {
    try {
      const q = await fetchQuote(s.ticker);
      if (q && q.c) {
        s.price     = +q.c.toFixed(2);
        s.change    = +q.d.toFixed(2);
        s.changePct = +q.dp.toFixed(2);
        s.open      = +q.o.toFixed(2);
        s.high      = +q.h.toFixed(2);
        s.low       = +q.l.toFixed(2);
      }
    } catch (e) {
      console.warn(`Quote failed for ${s.ticker}:`, e.message);
    }
  }
  // Signal app.js that prices are fresh
  window.dispatchEvent(new Event('quotesRefreshed'));
};

// ── Map range tabs → Finnhub resolution + lookback days ──────
window.RANGE_CONFIG = {
  '1D':  { resolution: '5',  days: 1    },
  '1W':  { resolution: '15', days: 7    },
  '1M':  { resolution: '60', days: 30   },
  '3M':  { resolution: 'D',  days: 90   },
  '6M':  { resolution: 'D',  days: 180  },
  'YTD': { resolution: 'D',  days: 90   },
  '1Y':  { resolution: 'W',  days: 365  },
  '2Y':  { resolution: 'W',  days: 730  },
  '5Y':  { resolution: 'M',  days: 1825 },
  '10Y': { resolution: 'M',  days: 3650 },
  'ALL': { resolution: 'M',  days: 7300 }
};

// ── Load chart candles for a ticker + range ─────────────────
window.loadRealChartData = async function (ticker, range) {
  const cfg  = window.RANGE_CONFIG[range];
  const toTs = Math.floor(Date.now() / 1000);
  const fromTs = toTs - cfg.days * 86400;

  try {
    const candles = await fetchCandles(ticker, cfg.resolution, fromTs, toTs);
    if (candles.s === 'ok' && candles.c && candles.c.length > 0) {
      const labels = candles.t.map(ts => {
        const d = new Date(ts * 1000);
        if (['1D','1W'].includes(range)) {
          return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        }
        if (['1M','3M','6M','YTD'].includes(range)) {
          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      });
      return { labels, data: candles.c.map(p => +p.toFixed(2)) };
    }
  } catch (e) {
    console.warn(`Candle fetch failed for ${ticker} ${range}:`, e.message);
  }
  return null; // caller falls back to mock
};

// ── Load real news ───────────────────────────────────────────
window.loadRealNews = async function (ticker) {
  try {
    const articles = await fetchCompanyNews(ticker);
    if (!articles || articles.length === 0) return null;

    return articles.slice(0, 6).map(n => ({
      source:    n.source || 'Reuters',
      headline:  n.headline,
      excerpt:   (n.summary || '').slice(0, 130) + '...',
      time:      timeAgo(n.datetime),
      sentiment: guessSentiment(n.headline + ' ' + (n.summary || '')),
      url:       n.url
    }));
  } catch (e) {
    console.warn(`News fetch failed for ${ticker}:`, e.message);
    return null;
  }
};

function timeAgo(unixTs) {
  const diff = Math.floor(Date.now() / 1000 - unixTs);
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function guessSentiment(text) {
  const t = text.toLowerCase();
  const bullish = ['surges','rises','beats','record','growth','gains','strong','upgrade','buy','profit','revenue up'];
  const bearish  = ['falls','drops','miss','recall','slump','decline','investigation','lawsuit','downgrade','loss','cut'];
  if (bullish.some(w => t.includes(w))) return 'bullish';
  if (bearish.some(w => t.includes(w)))  return 'bearish';
  return 'neutral';
}

// ── WebSocket live streaming prices ─────────────────────────
let _ws         = null;
let _wsReady    = false;
let _wsPending  = [];

window.startWebSocket = function (tickers) {
  if (_ws) { _ws.close(); }

  _ws = new WebSocket(`wss://ws.finnhub.io?token=${FINNHUB_KEY}`);

  _ws.onopen = () => {
    _wsReady = true;
    const all = [...new Set([...tickers, ..._wsPending])];
    all.forEach(t => _ws.send(JSON.stringify({ type: 'subscribe', symbol: t })));
    _wsPending = [];
    console.info('🟢 Finnhub WebSocket connected');
  };

  _ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === 'trade' && msg.data) {
        msg.data.forEach(trade => {
          const stock = window.STOCKS.find(s => s.ticker === trade.s);
          if (stock) {
            const oldPrice = stock.price;
            stock.price    = +trade.p.toFixed(2);
            stock.change   = +(stock.price - (stock.open || stock.price)).toFixed(2);
            stock.changePct= stock.open
              ? +((stock.change / stock.open) * 100).toFixed(2)
              : stock.changePct;
            // Notify UI
            window.dispatchEvent(new CustomEvent('livePriceUpdate', { detail: { ticker: trade.s, price: stock.price, oldPrice } }));
          }
        });
      }
    } catch (e) { /* ignore parse errors */ }
  };

  _ws.onerror = e => console.warn('WS error', e);
  _ws.onclose = () => { _wsReady = false; console.info('🔴 Finnhub WebSocket closed'); };
};

window.subscribeWS = function (ticker) {
  if (_wsReady) {
    _ws.send(JSON.stringify({ type: 'subscribe', symbol: ticker }));
  } else {
    _wsPending.push(ticker);
  }
};

window.unsubscribeWS = function (ticker) {
  if (_wsReady) {
    _ws.send(JSON.stringify({ type: 'unsubscribe', symbol: ticker }));
  }
};

// ── Exposed quote fetcher for LIVE mode polling ──────────────
window.fetchQuoteForLive = fetchQuote;
