/**
 * routes/portfolio.js
 * Virtual Portfolio API — trades and holdings backed by MongoDB.
 * POST /api/portfolio/trade      → log a buy/sell
 * GET  /api/portfolio/trades/:userId → fetch trade history
 * GET  /api/portfolio/bets/:userId   → fetch bet history
 * POST /api/portfolio/bet        → log a bet
 */
const router  = require('express').Router();
const { isConnected } = require('../db');
const { Trade, Bet, User } = require('../models');

// ─── Log a trade ──────────────────────────────────────────────────────────
router.post('/trade', async (req, res) => {
  if (!isConnected()) return res.status(503).json({ error: 'DB not available' });
  try {
    const { userId = 'guest', symbol, name, type, qty, price } = req.body;
    if (!symbol || !type || !qty || !price)
      return res.status(400).json({ error: 'symbol, type, qty, price required' });

    const total = qty * price;
    const trade = await Trade.create({ userId, symbol, name, type, qty, price, total });
    res.json({ success: true, trade });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Get trade history ────────────────────────────────────────────────────
router.get('/trades/:userId', async (req, res) => {
  if (!isConnected()) return res.status(503).json({ error: 'DB not available' });
  try {
    const trades = await Trade.find({ userId: req.params.userId }).sort({ timestamp: -1 }).limit(200);
    res.json(trades);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Log a bet ────────────────────────────────────────────────────────────
router.post('/bet', async (req, res) => {
  if (!isConnected()) return res.status(503).json({ error: 'DB not available' });
  try {
    const { userId = 'guest', symbol, direction, stake, multiplier, duration, entryPrice } = req.body;
    if (!symbol || !direction || !stake)
      return res.status(400).json({ error: 'symbol, direction, stake required' });

    const bet = await Bet.create({ userId, symbol, direction, stake, multiplier, duration, entryPrice });
    res.json({ success: true, bet });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Resolve a bet ────────────────────────────────────────────────────────
router.patch('/bet/:id/resolve', async (req, res) => {
  if (!isConnected()) return res.status(503).json({ error: 'DB not available' });
  try {
    const { outcome, exitPrice, pnl } = req.body;
    const bet = await Bet.findByIdAndUpdate(
      req.params.id,
      { outcome, exitPrice, pnl, resolvedAt: new Date() },
      { new: true }
    );
    if (!bet) return res.status(404).json({ error: 'Bet not found' });
    res.json({ success: true, bet });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Get bet history ──────────────────────────────────────────────────────
router.get('/bets/:userId', async (req, res) => {
  if (!isConnected()) return res.status(503).json({ error: 'DB not available' });
  try {
    const bets = await Bet.find({ userId: req.params.userId }).sort({ createdAt: -1 }).limit(200);
    res.json(bets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Upsert user profile ──────────────────────────────────────────────────
router.post('/user', async (req, res) => {
  if (!isConnected()) return res.status(503).json({ error: 'DB not available' });
  try {
    const { userId = 'guest', username, points, streak, badges } = req.body;
    const user = await User.findOneAndUpdate(
      { userId },
      { $set: { username, points, streak, badges, lastLogin: new Date() } },
      { upsert: true, new: true }
    );
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Get user profile ─────────────────────────────────────────────────────
router.get('/user/:userId', async (req, res) => {
  if (!isConnected()) return res.status(503).json({ error: 'DB not available' });
  try {
    const user = await User.findOne({ userId: req.params.userId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
