/**
 * routes/stocks.js
 * Stock data endpoints — NSE Indian stocks via Yahoo Finance.
 * Falls back to mock data when Yahoo Finance is unavailable.
 */

const router = require('express').Router();
const { STOCKS, MOCK_NEWS, generateHourlyFallbackHistory } = require('../data/mockData');
const YahooFinanceService = require('../services/YahooFinanceService');

// ─── GET /api/stocks ─────────────────────────────────────────────────────────
// Returns all NSE stocks with live prices from Yahoo Finance.
router.get('/', async (_req, res) => {
  try {
    const results = await Promise.all(
      STOCKS.map(async (s) => {
        const q = await YahooFinanceService.getQuote(s.symbol);
        if (q) {
          return {
            ...s,
            price:         q.price,
            change:        q.change,
            changePercent: q.changePercent,
            open:          q.open,
            high:          q.high,
            low:           q.low,
            volume:        q.volume,
            previousClose: q.previousClose,
          };
        }
        return s; // fallback to mock
      })
    );
    return res.json(results);
  } catch (err) {
    console.warn('[stocks] Yahoo Finance batch fetch failed:', err.message);
    res.json(STOCKS);
  }
});

// ─── GET /api/stocks/:symbol ──────────────────────────────────────────────────
router.get('/:symbol', async (req, res) => {
  const sym   = decodeURIComponent(req.params.symbol).toUpperCase();
  const stock = STOCKS.find(s => s.symbol.toUpperCase() === sym);
  if (!stock) return res.status(404).json({ error: 'Stock not found' });

  const q = await YahooFinanceService.getQuote(stock.symbol);
  if (q) {
    return res.json({ ...stock, price: q.price, change: q.change, changePercent: q.changePercent, open: q.open, high: q.high, low: q.low });
  }
  res.json(stock);
});

// ─── GET /api/stocks/:symbol/history?days=90 ─────────────────────────────────
router.get('/:symbol/history', async (req, res) => {
  const sym   = decodeURIComponent(req.params.symbol).toUpperCase();
  const stock = STOCKS.find(s => s.symbol.toUpperCase() === sym);
  if (!stock) return res.status(404).json({ error: 'Stock not found' });

  const days = parseInt(req.query.days) || 90;

  const history = await YahooFinanceService.getHistory(stock.symbol, days);
  if (history && history.length > 0) {
    return res.json({ symbol: stock.symbol, days, history });
  }

  // Fallback: generate mock history
  const fallback = generateHourlyFallbackHistory(stock.price, days, stock.symbol);
  res.json({ symbol: stock.symbol, days, history: fallback });
});

// ─── GET /api/stocks/:symbol/news ────────────────────────────────────────────
router.get('/:symbol/news', async (req, res) => {
  const sym  = decodeURIComponent(req.params.symbol).toUpperCase();
  // Return curated Indian market news
  const news = MOCK_NEWS[STOCKS.find(s => s.symbol.toUpperCase() === sym)?.symbol] || MOCK_NEWS.DEFAULT;
  res.json(news);
});

module.exports = router;
