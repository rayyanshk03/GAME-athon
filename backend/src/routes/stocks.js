/**
 * routes/stocks.js
 * Stock data endpoints.
 * - Uses Yahoo Finance (no API key) as the sole live data source.
 * - Falls back to generated mock data when Yahoo is unreachable.
 * - Frontend reads all stock data exclusively through these routes.
 */

const router = require('express').Router();
const { STOCKS, generateDailyFallbackHistory } = require('../data/mockData');
const YahooService = require('../services/YahooFinanceService');

const GoogleNews = (() => {
  try { return require('../services/GoogleNewsService'); } catch { return null; }
})();

// ─── GET /api/stocks ────────────────────────────────────────────────────────
// Returns all stocks with live prices from Yahoo Finance, or mock on failure.
router.get('/', async (_req, res) => {
  try {
    const results = await Promise.all(
      STOCKS.map(async (s) => {
        try {
          const q = await YahooService.getQuote(s.symbol);
          if (q && q.c) {
            return {
              ...s,
              price:         q.c,
              change:        q.d,
              changePercent: q.dp,
              open:          q.o,
              high:          q.h,
              low:           q.l,
              prevClose:     q.pc,
            };
          }
        } catch { /* fall through to mock row */ }
        return s;
      })
    );
    return res.json(results);
  } catch (err) {
    console.warn('[stocks] Yahoo Finance batch failed, using mock data:', err.message);
    return res.json(STOCKS);
  }
});

// ─── GET /api/stocks/:symbol ─────────────────────────────────────────────────
router.get('/:symbol', async (req, res) => {
  const stock = STOCKS.find(s => s.symbol === req.params.symbol.toUpperCase());
  if (!stock) return res.status(404).json({ error: 'Stock not found' });

  try {
    const q = await YahooService.getQuote(stock.symbol);
    if (q && q.c) {
      return res.json({
        ...stock,
        price:         q.c,
        change:        q.d,
        changePercent: q.dp,
        open:          q.o,
        high:          q.h,
        low:           q.l,
        prevClose:     q.pc,
      });
    }
  } catch (err) {
    console.warn(`[stocks] Yahoo quote failed for ${stock.symbol}:`, err.message);
  }

  res.json(stock);
});

// ─── GET /api/stocks/:symbol/price-at?exitAt=<unix_ms> ───────────────────────
// Returns the real market close price nearest to the requested exit timestamp.
// Used by the frontend to resolve bets against real Yahoo Finance data.
router.get('/:symbol/price-at', async (req, res) => {
  const stock = STOCKS.find(s => s.symbol === req.params.symbol.toUpperCase());
  if (!stock) return res.status(404).json({ error: 'Stock not found' });

  const exitAt = parseInt(req.query.exitAt);
  if (!exitAt || isNaN(exitAt)) return res.status(400).json({ error: 'exitAt (unix ms) is required' });

  try {
    const price = await YahooService.getPriceAt(stock.symbol, exitAt);
    if (price != null) return res.json({ price: Math.round(price * 100) / 100, source: 'yahoo' });
  } catch (err) {
    console.warn(`[stocks] price-at failed for ${stock.symbol}:`, err.message);
  }

  // Fallback 1: current live price
  try {
    const q = await YahooService.getQuote(stock.symbol);
    if (q?.c) return res.json({ price: q.c, source: 'quote_fallback' });
  } catch { }

  // Fallback 2: mock price
  res.json({ price: stock.price, source: 'mock_fallback' });
});

// ─── GET /api/stocks/:symbol/history?days=7 ──────────────────────────────────
router.get('/:symbol/history', async (req, res) => {
  const stock = STOCKS.find(s => s.symbol === req.params.symbol.toUpperCase());
  if (!stock) return res.status(404).json({ error: 'Stock not found' });

  const days = parseInt(req.query.days) || 7;

  try {
    const data = await YahooService.getHistory(stock.symbol, 'D', days);
    if (data.s === 'ok' && data.c && data.c.length > 0) {
      const history = data.c.map((closePrice, index) => {
        const d = new Date(data.t[index] * 1000);
        return {
          time:      d.getTime(),
          dateLabel: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          price:     closePrice,
          open:      data.o[index],
          high:      data.h[index],
          low:       data.l[index],
          volume:    data.v[index],
        };
      });
      return res.json({ symbol: stock.symbol, days, history });
    }
  } catch (err) {
    console.warn(`[stocks] Yahoo history failed for ${stock.symbol}:`, err.message);
  }

  // Last resort: generated fallback history
  const history = generateDailyFallbackHistory(stock.price, days, stock.symbol);
  res.json({ symbol: stock.symbol, days, history });
});

// ─── GET /api/stocks/:symbol/news?days=7 ─────────────────────────────────────
// Primary: Google News RSS (free, no key). Backup: Yahoo Finance search.
router.get('/:symbol/news', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();

  // 1. Google News RSS
  if (GoogleNews) {
    try {
      const articles = await GoogleNews.getCompanyNews(symbol, 10);
      if (articles && articles.length > 0) return res.json(articles);
    } catch (err) {
      console.warn(`[stocks] Google News failed for ${symbol}:`, err.message);
    }
  }

  // 2. Yahoo Finance search fallback
  try {
    const articles = await YahooService.getCompanyNews(symbol, 7);
    if (articles && articles.length > 0) return res.json(articles);
  } catch (err) {
    console.warn(`[stocks] Yahoo news failed for ${symbol}:`, err.message);
  }

  res.json([]);
});

module.exports = router;
