/**
 * StockQuest Backend — src/index.js
 * Express API server — Storage proxy, AI relay, Engines, Yahoo Finance proxy
 */
const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const { connectDB } = require('./db');
const storageRoutes   = require('./routes/storage');
const aiRoutes        = require('./routes/ai');
const stockRoutes     = require('./routes/stocks');
const engineRoutes    = require('./routes/engines');
const portfolioRoutes = require('./routes/portfolio');
const authRoutes      = require('./routes/auth');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ─────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

// ── Routes ─────────────────────────────────────────────────────
app.use('/api/store',     storageRoutes);    // GET/POST/DELETE /api/store/:key
app.use('/api/ai',        aiRoutes);         // POST /api/ai/explain | /tip | /chat | /recommend
app.use('/api/stocks',    stockRoutes);      // GET /api/stocks | /:symbol | /:symbol/history | /:symbol/news
app.use('/api/engine',    engineRoutes);     // POST /api/engine/outcome | /validate-bet | /backtest
app.use('/api/portfolio', portfolioRoutes);  // POST /api/portfolio/trade | /bet | GET /trades | /bets | /user
app.use('/api/auth',      authRoutes);       // POST /api/auth/register | /login | GET /me

// ── Global Error Handling ─────────────────────────────────────
process.on('unhandledRejection', (reason) => {
  console.error('\x1b[31m%s\x1b[0m', '❌ Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('\x1b[31m%s\x1b[0m', '💥 Uncaught Exception:', err.message);
  process.exit(1);
});

// ── Health check ───────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok', version: '1.0.0', db: require('./db').isConnected() }));
app.get('/', (_req, res) => res.send('🚀 StockQuest API is live and connected. Use /api routes to interact.'));

// ── Start ──────────────────────────────────────────────────────
async function start() {
  try {
    const { connectDB, isConnected } = require('./db');
    await connectDB(); // Initial connection attempt

    const server = app.listen(PORT, () => {
      console.log('\x1b[32m%s\x1b[0m', `⚡ StockQuest API running at http://localhost:${PORT}`);
      console.log(`   Finnhub: ${process.env.FINNHUB_API_KEY ? '✅ Connected' : '⚠️  No key — using Yahoo Finance'}`);
      console.log(`   OpenAI:  ${process.env.OPENAI_API_KEY  ? '✅ Connected' : '⚠️  No key — using fallbacks'}`);
      console.log(`   MongoDB: ${isConnected()            ? '✅ Connected' : '⚠️  Not Connected — using memory limited'}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error('\x1b[31m%s\x1b[0m', `❌ Port ${PORT} is already in use.`);
        console.log('   Stopping old processes and retrying in 2s...');
        // Node's --watch will trigger a restart automatically if we exit here
        setTimeout(() => process.exit(1), 1000); 
      } else {
        console.error('❌ Server error:', err);
      }
    });

  } catch (err) {
    console.error('❌ Startup failed:', err.message);
    process.exit(1);
  }
}

start();
