/**
 * routes/finnhub.js  (now backed by Yahoo Finance — no API key needed)
 * Route paths kept the same so the frontend doesn't need to change.
 */

const router = require('express').Router();
const Yahoo  = require('../services/YahooFinanceService');

// ── GET /api/finnhub/quote/:ticker ────────────────────────────────
router.get('/quote/:ticker', async (req, res) => {
  try {
    const data = await Yahoo.getQuote(req.params.ticker.toUpperCase());
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

// ── GET /api/finnhub/candles/:ticker?resolution=5&days=1 ──────────
router.get('/candles/:ticker', async (req, res) => {
  const { resolution = 'D', days = 30 } = req.query;
  try {
    const data = await Yahoo.getHistory(
      req.params.ticker.toUpperCase(),
      resolution,
      parseInt(days)
    );
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

// ── GET /api/finnhub/news/:ticker?days=7 ─────────────────────────
router.get('/news/:ticker', async (req, res) => {
  const days = parseInt(req.query.days) || 7;
  try {
    const articles = await Yahoo.getCompanyNews(
      req.params.ticker.toUpperCase(),
      days
    );
    res.json(articles);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

module.exports = router;
