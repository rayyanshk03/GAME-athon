/**
 * routes/stocks.js
 * Stock data endpoints.
 * Currently returns mock data — swap with Alpha Vantage / Yahoo Finance in production.
 */
const router = require('express').Router();

const STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.',       price: 189.30, changePercent:  1.15, sector: 'Technology',    risk: 'moderate' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.',   price: 175.48, changePercent: -0.70, sector: 'Technology',    risk: 'moderate' },
  { symbol: 'TSLA', name: 'Tesla Inc.',        price: 248.50, changePercent:  2.33, sector: 'Automotive',   risk: 'high'     },
  { symbol: 'AMZN', name: 'Amazon.com',        price: 198.20, changePercent: -1.71, sector: 'E-Commerce',   risk: 'moderate' },
  { symbol: 'MSFT', name: 'Microsoft Corp.',   price: 415.80, changePercent:  1.02, sector: 'Technology',   risk: 'low'      },
  { symbol: 'NVDA', name: 'NVIDIA Corp.',      price: 875.40, changePercent:  1.78, sector: 'Semiconductors',risk: 'high'    },
  { symbol: 'META', name: 'Meta Platforms',    price: 512.60, changePercent: -1.71, sector: 'Social Media', risk: 'moderate' },
  { symbol: 'JPM',  name: 'JPMorgan Chase',    price: 215.30, changePercent:  0.87, sector: 'Finance',      risk: 'low'      },
];

function generateHistory(basePrice, days = 7) {
  const data = [];
  let price = basePrice * 0.95;
  const now  = Date.now();
  for (let i = days * 24; i >= 0; i--) {
    price += price * (Math.random() * 0.04 - 0.02);
    data.push({ time: now - i * 3600000, price: Math.round(price * 100) / 100 });
  }
  return data;
}

// GET /api/stocks
router.get('/', (_req, res) => res.json(STOCKS));

// GET /api/stocks/:symbol
router.get('/:symbol', (req, res) => {
  const stock = STOCKS.find(s => s.symbol === req.params.symbol.toUpperCase());
  if (!stock) return res.status(404).json({ error: 'Stock not found' });
  res.json(stock);
});

// GET /api/stocks/:symbol/history?days=7
router.get('/:symbol/history', (req, res) => {
  const stock = STOCKS.find(s => s.symbol === req.params.symbol.toUpperCase());
  if (!stock) return res.status(404).json({ error: 'Stock not found' });
  const days    = parseInt(req.query.days) || 7;
  const history = generateHistory(stock.price, days);
  res.json({ symbol: stock.symbol, days, history });
});

module.exports = router;
