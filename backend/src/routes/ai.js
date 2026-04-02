/**
 * routes/ai.js
 * Server-side Gemini API proxy.
 * Keeps the API key off the browser — frontend hits /api/ai/* instead of Gemini directly.
 */
const router    = require('express').Router();
const { callGemini } = require('../services/geminiService');

// POST /api/ai/explain  { trade: {} }
router.post('/explain', async (req, res) => {
  try {
    const { trade } = req.body;
    const { symbol, direction, stake, multiplier, entryPrice, exitPrice, pointDelta, won } = trade;
    const pct = (((exitPrice - entryPrice) / entryPrice) * 100).toFixed(2);

    const prompt = `You are a friendly trading mentor in StockQuest, a gamified simulator.
User ${won ? 'WON' : 'LOST'} a trade:
- Stock: ${symbol} | Direction: ${direction.toUpperCase()} | Entry: $${entryPrice} → Exit: $${exitPrice} (${pct}%)
- Stake: ${stake} pts × ${multiplier}x → Outcome: ${pointDelta > 0 ? '+' : ''}${pointDelta} pts
Write 3 sentences: (1) why the stock moved, (2) what user did right/wrong, (3) one actionable tip.
Tone: encouraging, educational, concise.`;

    const text = await callGemini(prompt, 280);
    res.json({ text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/tip  { stats: {} }
router.post('/tip', async (req, res) => {
  try {
    const { stats } = req.body;
    const prompt = `You are a trading coach for StockQuest.
User stats — Win Rate: ${stats.winRate}% | Trades: ${stats.totalTrades} | Best sector: ${stats.bestSector || 'N/A'} | Avg multiplier: ${stats.avgMultiplier}x
Give one specific actionable tip in 2 sentences.`;
    const text = await callGemini(prompt, 180);
    res.json({ text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/chat  { question: string }
router.post('/chat', async (req, res) => {
  try {
    const { question } = req.body;
    const prompt = `You are an expert stock trading tutor in StockQuest.
User asks: "${question}"
Answer in 2-3 sentences. Clear, simple language. End with one encouraging phrase.`;
    const text = await callGemini(prompt, 220);
    res.json({ text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/recommend  { heldSymbols: [], available: [] }
router.post('/recommend', async (req, res) => {
  try {
    const { heldSymbols = [], available = [] } = req.body;
    const prompt = `You are an AI stock advisor for StockQuest.
User holds: ${heldSymbols.join(', ') || 'nothing yet'}.
Available: ${available.map(s => `${s.symbol}(${s.sector})`).join(', ')}.
Recommend 2 to consider and 1 to avoid:
✅ BUY: [SYMBOL] — reason
✅ WATCH: [SYMBOL] — reason
⛔ AVOID: [SYMBOL] — reason`;
    const text = await callGemini(prompt, 220);
    res.json({ text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
