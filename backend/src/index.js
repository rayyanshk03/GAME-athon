/**
 * StockQuest Backend — src/index.js
 * Express API server — Storage proxy, AI relay, Engines, Yahoo Finance proxy
 */
const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const storageRoutes  = require('./routes/storage');
const aiRoutes       = require('./routes/ai');
const stockRoutes    = require('./routes/stocks');
const engineRoutes   = require('./routes/engines');
const finnhubRoutes  = require('./routes/finnhub');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ─────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

// ── Routes ─────────────────────────────────────────────────────
app.use('/api/store',    storageRoutes);   // GET/POST/DELETE /api/store/:key
app.use('/api/ai',       aiRoutes);        // POST /api/ai/explain | /tip | /chat | /recommend
app.use('/api/stocks',   stockRoutes);     // GET /api/stocks | /:symbol | /:symbol/history | /:symbol/news
app.use('/api/engine',   engineRoutes);    // POST /api/engine/outcome | /validate-bet | /backtest | etc.
app.use('/api/finnhub',  finnhubRoutes);   // GET /api/finnhub/quote | /candles | /news | /ws-token

// ── Health check ───────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok', version: '1.0.0' }));

// ── Start ──────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`⚡ StockQuest API running at http://localhost:${PORT}`);
  console.log(`   Market data: ✅ Yahoo Finance (free, no key needed)`);

  const rag = process.env.RAG_API_URL?.replace(/\/$/, '');
  if (rag) {
    console.log(`   RAG:     ✅ All AI → ${rag}/api/ai/chat`);
  } else {
    console.log(`   OpenAI:  ${process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here' ? '✅ Connected' : '⚠️  No key — using fallbacks'}`);
  }
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.log(`⏳ Port ${PORT} is busy (likely due to reload). Retrying in 1.5s...`);
    server.close();
    setTimeout(() => {
      // Must create a completely fresh server — re-calling listen on a
      // closed server instance is invalid and causes ECONNREFUSED.
      const newServer = app.listen(PORT, () => {
        console.log(`⚡ StockQuest API restarted at http://localhost:${PORT}`);
      });
      newServer.on('error', (err) => console.error('Server restart error:', err));
    }, 1500);
  } else {
    console.error('Server error:', e);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => { server.close(); process.exit(0); });
process.on('SIGINT', () => { server.close(); process.exit(0); });
