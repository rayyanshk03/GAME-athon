/**
 * routes/engines.js
 * Exposes backend engine calculations as HTTP endpoints.
 * Frontend calls these rather than running the logic itself.
 */

const router = require('express').Router();
const { calculateOutcome, resolveTimedBet, getMaxStake, validateBet, checkSmartAlert, rollDoubleOrNothing } = require('../engine/OutcomeEngine');
const { computeHybridScore, resolveContest, getSimModeConfig } = require('../engine/HybridSignalEngine');
const { runBacktest, findOptimalEntry } = require('../engine/BacktestEngine');
const { checkBadgeUnlocks, checkDailyLogin, generateDailyQuests, getStreakBonus, updateQuestProgress } = require('../engine/RewardsEngine');

// ─── Outcome Engine ───────────────────────────────────────
// POST /api/engine/outcome
router.post('/outcome', (req, res) => {
  try {
    const { entryPrice, exitPrice, stake, multiplier, direction } = req.body;
    res.json(calculateOutcome(entryPrice, exitPrice, stake, multiplier, direction));
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// POST /api/engine/validate-bet
router.post('/validate-bet', (req, res) => {
  try {
    res.json(validateBet(req.body));
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// POST /api/engine/max-stake
router.post('/max-stake', (req, res) => {
  try {
    const { totalPoints, riskProfile } = req.body;
    res.json({ maxStake: getMaxStake(totalPoints, riskProfile) });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// POST /api/engine/resolve-timed-bet
router.post('/resolve-timed-bet', (req, res) => {
  try {
    const { bet, currentPrice } = req.body;
    res.json(resolveTimedBet(bet, currentPrice));
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// POST /api/engine/smart-alert
router.post('/smart-alert', (req, res) => {
  try {
    const { entryPrice, currentPrice, threshold } = req.body;
    res.json({ alert: checkSmartAlert(entryPrice, currentPrice, threshold) });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// POST /api/engine/double-or-nothing
router.post('/double-or-nothing', (_req, res) => {
  res.json({ multiplier: rollDoubleOrNothing() });
});

// ─── Hybrid Signal Engine ─────────────────────────────────
// POST /api/engine/hybrid-score
router.post('/hybrid-score', (req, res) => {
  try {
    const { voteData, aiSentiment } = req.body;
    res.json(computeHybridScore(voteData, aiSentiment));
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// POST /api/engine/resolve-contest
router.post('/resolve-contest', (req, res) => {
  try {
    const { room, currentPrices } = req.body;
    res.json(resolveContest(room, currentPrices));
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// GET /api/engine/sim-mode/:mode
router.get('/sim-mode/:mode', (req, res) => {
  res.json(getSimModeConfig(req.params.mode));
});

// ─── Backtest Engine ──────────────────────────────────────
// POST /api/engine/backtest
router.post('/backtest', (req, res) => {
  try {
    const { priceHistory, options } = req.body;
    res.json(runBacktest(priceHistory, options));
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// POST /api/engine/optimal-entry
router.post('/optimal-entry', (req, res) => {
  try {
    const { priceHistory, direction } = req.body;
    res.json({ index: findOptimalEntry(priceHistory, direction) });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ─── Rewards Engine ───────────────────────────────────────
// POST /api/engine/check-badges
router.post('/check-badges', (req, res) => {
  try {
    const { stats, currentBadgeIds } = req.body;
    res.json(checkBadgeUnlocks(stats, currentBadgeIds));
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// POST /api/engine/daily-login
router.post('/daily-login', (req, res) => {
  try {
    const { lastLoginTs } = req.body;
    res.json(checkDailyLogin(lastLoginTs));
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// GET /api/engine/daily-quests
router.get('/daily-quests', (_req, res) => {
  res.json(generateDailyQuests());
});

// POST /api/engine/streak-bonus
router.post('/streak-bonus', (req, res) => {
  res.json({ bonus: getStreakBonus(req.body.streak) });
});

// POST /api/engine/update-quest-progress
router.post('/update-quest-progress', (req, res) => {
  try {
    const { quests, eventType, value } = req.body;
    res.json(updateQuestProgress(quests, eventType, value));
  } catch (e) { res.status(400).json({ error: e.message }); }
});

module.exports = router;
