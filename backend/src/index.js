/**
 * StockQuest Backend — src/index.js
 * Express API server — Storage proxy, AI relay, Engines, Finnhub proxy
 */
const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const storageRoutes = require('./routes/storage');
const aiRoutes      = require('./routes/ai');
const stockRoutes   = require('./routes/stocks');
const engineRoutes  = require('./routes/engines');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ─────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

// ── Routes ─────────────────────────────────────────────────────
app.use('/api/store',   storageRoutes);  // GET/POST/DELETE /api/store/:key
app.use('/api/ai',      aiRoutes);       // POST /api/ai/explain | /tip | /chat | /recommend
app.use('/api/stocks',  stockRoutes);    // GET /api/stocks | /:symbol | /:symbol/history | /:symbol/news
app.use('/api/engine',  engineRoutes);   // POST /api/engine/outcome | /validate-bet | /backtest | etc.

// ── Health check ───────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok', version: '1.0.0' }));

// ── Start ──────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`⚡ StockQuest API running at http://localhost:${PORT}`);
  console.log(`   Finnhub: ${process.env.FINNHUB_API_KEY ? '✅ Connected' : '⚠️  No key — using mock data'}`);
  console.log(`   OpenAI:  ${process.env.OPENAI_API_KEY  ? '✅ Connected' : '⚠️  No key — using fallbacks'}`);
});
