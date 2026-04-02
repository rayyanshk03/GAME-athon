/**
 * routes/stocks.js
 * Stock data endpoints.
 * - Falls back to mock data when Finnhub key is not set.
 * - Frontend reads all stock data exclusively through these routes.
 */

const router = require('express').Router();
const { STOCKS, MOCK_NEWS, generateDailyFallbackHistory } = require('../data/mockData');

let FinnhubService = null;
if (process.env.FINNHUB_API_KEY) {
  try { FinnhubService = require('../services/FinnhubService'); } catch {}
}

// ─── GET /api/stocks ───────────────────────────────────────────────
// Returns all stocks. Tries Finnhub live prices; falls back to mock.
router.get('/', async (_req, res) => {
  if (FinnhubService) {
    try {
      const results = await Promise.all(
        STOCKS.map(async (s) => {
          try {
            const q = await FinnhubService.getQuote(s.symbol);
            if (q && q.c) {
              return { ...s, price: q.c, change: q.d, changePercent: q.dp, open: q.o, high: q.h, low: q.l };
            }
          } catch {}
          return s;
        })
      );
      return res.json(results);
    } catch {}
  }
  res.json(STOCKS);
});

// ─── GET /api/stocks/:symbol ───────────────────────────────────────
router.get('/:symbol', async (req, res) => {
  const stock = STOCKS.find(s => s.symbol === req.params.symbol.toUpperCase());
  if (!stock) return res.status(404).json({ error: 'Stock not found' });

  if (FinnhubService) {
    try {
      const q = await FinnhubService.getQuote(stock.symbol);
      if (q && q.c) {
        return res.json({ ...stock, price: q.c, change: q.d, changePercent: q.dp, open: q.o, high: q.h, low: q.l });
      }
    } catch {}
  }
  res.json(stock);
});

// ─── GET /api/stocks/:symbol/history?days=7 ───────────────────────
router.get('/:symbol/history', async (req, res) => {
  const stock = STOCKS.find(s => s.symbol === req.params.symbol.toUpperCase());
  if (!stock) return res.status(404).json({ error: 'Stock not found' });

  const days = parseInt(req.query.days) || 7;

  if (FinnhubService) {
    try {
      const data = await FinnhubService.getHistory(stock.symbol, 'D', days);
      if (data.s === 'ok' && data.c && data.c.length > 0) {
        const history = data.c.map((closePrice, index) => {
          const d = new Date(data.t[index] * 1000);
          return {
            time: d.getTime(),
            dateLabel: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            price: closePrice,
            open:  data.o[index],
            high:  data.h[index],
            low:   data.l[index],
            volume: data.v[index],
          };
        });
        return res.json({ symbol: stock.symbol, days, history });
      }
    } catch {}
  }

  // Fallback: generate mock history
  const history = generateDailyFallbackHistory(stock.price, days, stock.symbol);
  res.json({ symbol: stock.symbol, days, history });
});

// ─── GET /api/stocks/:symbol/news?days=7 ──────────────────────────
router.get('/:symbol/news', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const days   = parseInt(req.query.days) || 7;

  if (FinnhubService) {
    try {
      const articles = await FinnhubService.getCompanyNews(symbol, days);
      if (articles && articles.length > 0) {
        return res.json(articles.slice(0, 10));
      }
    } catch {}
  }

  // Fallback: return mock news
  const news = MOCK_NEWS[symbol] || MOCK_NEWS.DEFAULT;
  res.json(news);
});

module.exports = router;
