/**
 * YahooFinanceService.js — Backend Yahoo Finance API Service
 * No API key required. Uses native fetch only (no npm library).
 *
 * Output shapes are intentionally identical to Finnhub so all
 * existing routes that used Finnhub need zero payload changes.
 */

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; StockQuestBot/1.0)',
  Accept: 'application/json',
};

// ── Resolution → Yahoo interval / range mapping ───────────────────────────────
const INTERVAL_MAP = {
  '1':  '1m',
  '5':  '5m',
  '15': '15m',
  '30': '30m',
  '60': '60m',
  'D':  '1d',
  'W':  '1wk',
  'M':  '1mo',
};

function resolveInterval(resolution) {
  return INTERVAL_MAP[resolution] || '1d';
}

/** Convert a "days back" number into a Yahoo `range` string. */
function daysToRange(days) {
  if (days <= 1)   return '1d';
  if (days <= 5)   return '5d';
  if (days <= 30)  return '1mo';
  if (days <= 90)  return '3mo';
  if (days <= 180) return '6mo';
  if (days <= 365) return '1y';
  if (days <= 730) return '2y';
  return '5y';
}

// ── Internal fetch helper ─────────────────────────────────────────────────────
async function yFetch(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`Yahoo Finance HTTP ${res.status} for ${url}`);
  return res.json();
}

// ── getQuote ──────────────────────────────────────────────────────────────────
/**
 * Fetch current quote for a ticker.
 * Returns Finnhub-compatible format:
 *   { c, d, dp, h, l, o, pc }
 *   c  = current price
 *   d  = change
 *   dp = change percent
 *   h  = day high
 *   l  = day low
 *   o  = open
 *   pc = previous close
 */
async function getQuote(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
  const json = await yFetch(url);

  const result  = json?.chart?.result?.[0];
  if (!result) return null;

  const meta = result.meta;
  const c  = meta.regularMarketPrice      ?? null;
  const pc = meta.chartPreviousClose      ?? meta.previousClose ?? c;
  const o  = meta.regularMarketOpen       ?? c;
  const h  = meta.regularMarketDayHigh    ?? c;
  const l  = meta.regularMarketDayLow     ?? c;
  const d  = c != null && pc != null ? +(c - pc).toFixed(4)          : 0;
  const dp = c != null && pc != null ? +((c - pc) / pc * 100).toFixed(4) : 0;

  return { c, d, dp, h, l, o, pc };
}

// ── getHistory ────────────────────────────────────────────────────────────────
/**
 * Fetch OHLCV candle history.
 * Returns Finnhub-compatible format:
 *   { s: 'ok', c: [...], h: [...], l: [...], o: [...], t: [...], v: [...] }
 */
async function getHistory(symbol, resolution = 'D', days = 30) {
  const interval = resolveInterval(resolution);
  const range    = daysToRange(days);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;

  const json = await yFetch(url);
  const result = json?.chart?.result?.[0];
  if (!result) return { s: 'no_data' };

  const timestamps = result.timestamps ?? result.timestamp ?? [];
  const q = result.indicators?.quote?.[0];
  if (!timestamps.length || !q) return { s: 'no_data' };

  // Filter out null bars (market closed gaps)
  const t = [], o = [], h = [], l = [], c = [], v = [];
  for (let i = 0; i < timestamps.length; i++) {
    if (q.close[i] == null) continue;
    t.push(timestamps[i]);
    o.push(q.open[i]   ?? 0);
    h.push(q.high[i]   ?? 0);
    l.push(q.low[i]    ?? 0);
    c.push(q.close[i]);
    v.push(q.volume[i] ?? 0);
  }

  if (!c.length) return { s: 'no_data' };
  return { s: 'ok', t, o, h, l, c, v };
}

// ── getCompanyNews ────────────────────────────────────────────────────────────
/**
 * Fetch recent company news via Yahoo Finance search.
 * Returns: [{ headline, summary, source, datetime, url }]
 */
async function getCompanyNews(symbol, _days = 7) {
  const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(symbol)}&newsCount=10&enableFuzzyQuery=false`;
  const json = await yFetch(url);

  const news = json?.news ?? [];
  return news.map((a, i) => ({
    id:       a.uuid || String(i),
    category: 'news',
    datetime: a.providerPublishTime ?? Math.floor(Date.now() / 1000),
    headline: a.title ?? '',
    summary:  a.title ?? '',        // Yahoo search doesn't return a body
    source:   a.publisher ?? 'Yahoo Finance',
    url:      a.link ?? '',
    image:    a.thumbnail?.resolutions?.[0]?.url ?? '',
    related:  symbol,
  }));
}

// ── getPriceAt ────────────────────────────────────────────────────────────────
/**
 * Fetch the closest real market price to a given exit timestamp.
 * Used for realistic bet resolution — no more Math.random().
 *
 * @param {string} symbol   - Ticker symbol
 * @param {number} exitAtMs - Target exit timestamp in ms (Date.now() format)
 * @returns {number|null}   - Close price at or nearest to that time, or null
 */
async function getPriceAt(symbol, exitAtMs) {
  const nowMs   = Date.now();
  const diffMs  = nowMs - exitAtMs;
  const exitUnix = Math.floor(exitAtMs / 1000);

  // Exit is in the future — return current price
  if (diffMs < 0) {
    const q = await getQuote(symbol);
    return q?.c ?? null;
  }

  // Choose interval & range to best cover the target timestamp
  let interval, range;
  if (diffMs < 2 * 3600000) {        // within 2 hours → 1m bars, 1d range
    interval = '1m'; range = '1d';
  } else if (diffMs < 24 * 3600000) { // within 1 day → 15m bars, 1d range
    interval = '15m'; range = '1d';
  } else if (diffMs < 7 * 86400000) { // within 1 week → 1h bars, 5d range
    interval = '60m'; range = '5d';
  } else {                             // older → daily bars, 1mo range
    interval = '1d'; range = '1mo';
  }

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;
  const json = await yFetch(url);
  const result = json?.chart?.result?.[0];
  if (!result) return null;

  const timestamps = result.timestamps ?? result.timestamp ?? [];
  const closes     = result.indicators?.quote?.[0]?.close ?? [];

  // Walk timestamps to find the one nearest to exitUnix
  let bestIdx  = -1;
  let bestDiff = Infinity;
  for (let i = 0; i < timestamps.length; i++) {
    if (closes[i] == null) continue;
    const d = Math.abs(timestamps[i] - exitUnix);
    if (d < bestDiff) { bestDiff = d; bestIdx = i; }
  }

  return bestIdx >= 0 ? closes[bestIdx] : null;
}

module.exports = { getQuote, getHistory, getCompanyNews, getPriceAt };
