/**
 * YahooFinanceService.js — Backend Yahoo Finance API Service
 * No API key required. Uses native fetch only (no npm library).
 *
 * Yahoo Finance tightened their API in 2024 — direct calls to
 * query1.finance.yahoo.com require a valid crumb+cookie pair.
 * This service handles that automatically with a crumb cache
 * and falls back to query2 when query1 is unavailable.
 *
 * Output shapes are intentionally identical to Finnhub so all
 * existing routes that used Finnhub need zero payload changes.
 */

// ── Crumb cache ───────────────────────────────────────────────────────────────
let _crumb = null;
let _cookie = null;
let _crumbFetchedAt = 0;
const CRUMB_TTL_MS = 30 * 60 * 1000; // refresh every 30 min

const BASE_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  Origin: 'https://finance.yahoo.com',
  Referer: 'https://finance.yahoo.com/',
};

/** Fetch and cache the Yahoo Finance crumb + session cookie. */
async function ensureCrumb() {
  const now = Date.now();
  if (_crumb && now - _crumbFetchedAt < CRUMB_TTL_MS) return; // still valid

  try {
    // Step 1: hit the consent/cookie endpoint to get a session cookie
    const consentRes = await fetch(
      'https://fc.yahoo.com',
      { headers: BASE_HEADERS, redirect: 'follow' }
    );
    const rawCookie = consentRes.headers.get('set-cookie') || '';
    // Extract A3 or similar session cookies
    _cookie = rawCookie.split(',').map(c => c.split(';')[0].trim()).join('; ');

    // Step 2: fetch the crumb using the session cookie
    const crumbRes = await fetch(
      'https://query1.finance.yahoo.com/v1/test/getcrumb',
      {
        headers: {
          ...BASE_HEADERS,
          ..._cookie ? { Cookie: _cookie } : {},
        },
      }
    );

    if (crumbRes.ok) {
      const text = await crumbRes.text();
      if (text && text.length < 50 && !text.includes('<')) {
        // Valid crumb looks like "8tbKi9xYiMq"
        _crumb = text.trim();
        _crumbFetchedAt = now;
        console.log('[Yahoo] Crumb refreshed ✅');
        return;
      }
    }
  } catch (e) {
    console.warn('[Yahoo] Crumb fetch failed, will try without crumb:', e.message);
  }

  // If crumb fetch failed, reset so we try again next time
  _crumb = null;
  _cookie = null;
}

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

// ── Internal fetch helper with retry across hosts ─────────────────────────────
/**
 * Try query1 first (with crumb); fall back to query2 if it fails.
 * Both attempts share the same path+query string.
 */
async function yFetch(path, extraParams = {}) {
  await ensureCrumb();

  const params = new URLSearchParams(extraParams);
  if (_crumb) params.set('crumb', _crumb);
  const qs = params.toString() ? `&${params.toString()}` : '';

  const buildUrl = (host) => `https://${host}.finance.yahoo.com${path}${qs}`;

  const headers = {
    ...BASE_HEADERS,
    ..._cookie ? { Cookie: _cookie } : {},
  };

  // ── Attempt 1: query1 ──────────────────────────────────────────────────────
  for (const host of ['query1', 'query2']) {
    try {
      const url = buildUrl(host);
      const res = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(12000), // 12s per attempt
      });

      if (res.ok) return await res.json();

      // 401 → crumb is stale, force-refresh and retry once on query2
      if (res.status === 401 && host === 'query1') {
        _crumb = null;
        _cookie = null;
        _crumbFetchedAt = 0;
        continue;
      }

      throw new Error(`Yahoo Finance HTTP ${res.status} from ${host}`);
    } catch (err) {
      if (host === 'query2') throw err; // both failed → propagate
      console.warn(`[Yahoo] ${host} failed (${err.message}), trying query2…`);
    }
  }
}

// ── getQuote ──────────────────────────────────────────────────────────────────
/**
 * Fetch current quote for a ticker.
 * Returns Finnhub-compatible format:
 *   { c, d, dp, h, l, o, pc }
 */
async function getQuote(symbol) {
  const json = await yFetch(
    `/v8/finance/chart/${encodeURIComponent(symbol)}`,
    { interval: '1d', range: '1d' }
  );

  const result = json?.chart?.result?.[0];
  if (!result) return null;

  const meta = result.meta;
  const c  = meta.regularMarketPrice      ?? null;
  const pc = meta.chartPreviousClose      ?? meta.previousClose ?? c;
  const o  = meta.regularMarketOpen       ?? c;
  const h  = meta.regularMarketDayHigh    ?? c;
  const l  = meta.regularMarketDayLow     ?? c;
  const d  = c != null && pc != null ? +(c - pc).toFixed(4)            : 0;
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

  const json = await yFetch(
    `/v8/finance/chart/${encodeURIComponent(symbol)}`,
    { interval, range }
  );

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
  const json = await yFetch(
    `/v1/finance/search`,
    { q: symbol, newsCount: '10', enableFuzzyQuery: 'false' }
  );

  const news = json?.news ?? [];
  return news.map((a, i) => ({
    id:       a.uuid || String(i),
    category: 'news',
    datetime: a.providerPublishTime ?? Math.floor(Date.now() / 1000),
    headline: a.title ?? '',
    summary:  a.title ?? '',
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

  const json = await yFetch(
    `/v8/finance/chart/${encodeURIComponent(symbol)}`,
    { interval, range }
  );

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
