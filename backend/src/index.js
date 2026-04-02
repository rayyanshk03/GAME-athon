/**
 * StockQuest Backend — src/index.js
 * Express API server — Storage proxy, AI relay, future DB integration
 */
const express  = require('express');
const cors     = require('cors');
require('dotenv').config();

const storageRoutes = require('./routes/storage');
const aiRoutes      = require('./routes/ai');
const stockRoutes   = require('./routes/stocks');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ─────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

// ── Routes ─────────────────────────────────────────────
app.use('/api/store',  storageRoutes);   // GET/POST /api/store/:key
app.use('/api/ai',     aiRoutes);        // POST /api/ai/explain | /tip | /chat | /recommend
app.use('/api/stocks', stockRoutes);     // GET /api/stocks | /api/stocks/:symbol/history

// ── Health check ───────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok', version: '1.0.0' }));

// ── Start ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`⚡ StockQuest API running at http://localhost:${PORT}`);
});
