/**
 * routes/ai.js — OpenAI proxy with rich offline fallbacks.
 * When OPENAI_API_KEY is missing, localRecommend / localTip / localExplain
 * generate useful content instead of a config error message.
 */
const router = require('express').Router();
const { callOpenAI, localRecommend, localExplain, localTip } = require('../services/openaiService');
const { askFinGPT } = require('../services/fingptService');

// POST /api/ai/explain  { trade: {} }
router.post('/explain', async (req, res) => {
  try {
    const { trade } = req.body;
    const { symbol, direction, stake, multiplier, entryPrice, exitPrice, pointDelta, won } = trade;
    const pct = (((exitPrice - entryPrice) / entryPrice) * 100).toFixed(2);

    const fallback = localExplain({ symbol, direction, won, pct: Number(pct), pointDelta, multiplier });

    const prompt = `You are a friendly trading mentor in StockQuest, a gamified simulator.
User ${won ? 'WON' : 'LOST'} a trade:
- Stock: ${symbol} | Direction: ${direction.toUpperCase()} | Entry: $${entryPrice} → Exit: $${exitPrice} (${pct}%)
- Stake: ${stake} pts × ${multiplier}x → Outcome: ${pointDelta > 0 ? '+' : ''}${pointDelta} pts
Write 3 sentences: (1) why the stock moved, (2) what user did right/wrong, (3) one actionable tip.
Tone: encouraging, educational, concise.`;

    const text = await callOpenAI(prompt, 280, fallback);
    res.json({ text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/tip  { stats: {} }
router.post('/tip', async (req, res) => {
  try {
    const { stats } = req.body;
    const fallback  = localTip(stats || {});

    const prompt = `You are a trading coach for StockQuest.
User stats — Win Rate: ${stats.winRate}% | Trades: ${stats.totalTrades} | Best sector: ${stats.bestSector || 'N/A'} | Avg multiplier: ${stats.avgMultiplier}x
Give one specific actionable tip in 2 sentences.`;

    const text = await callOpenAI(prompt, 180, fallback);
    res.json({ text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/chat  { question: string }
// Priority: FinGPT RAG → OpenAI → local fallback
router.post('/chat', async (req, res) => {
  try {
    const { question } = req.body;
    const localFallback = '💡 Combine the chart, RSI/trend signals, and Crowd+AI score before placing a bet. Check the Learning Hub for deeper lessons. You\'ve got this!';

    // 1️⃣ Try FinGPT RAG first
    try {
      const ragAnswer = await askFinGPT(question);
      console.log('[FinGPT] ✅ RAG answered:', question.slice(0, 60));
      return res.json({ text: ragAnswer, source: 'fingpt' });
    } catch (ragErr) {
      console.warn('[FinGPT] ⚠️  RAG failed, trying OpenAI:', ragErr.message);
    }

    // 2️⃣ Fall back to OpenAI (if key present) or local
    const prompt = `You are an expert stock trading tutor in StockQuest.
User asks: "${question}"
Answer in 2-3 sentences. Clear, simple language. End with one encouraging phrase.`;

    const text = await callOpenAI(prompt, 220, localFallback);
    res.json({ text, source: 'openai' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/recommend  { heldSymbols: [], available: [] }
router.post('/recommend', async (req, res) => {
  try {
    const { heldSymbols = [], available = [] } = req.body;
    const fallback = localRecommend(heldSymbols, available);

    const prompt = `You are an AI stock advisor for StockQuest.
User holds: ${heldSymbols.join(', ') || 'nothing yet'}.
Available: ${available.map(s => `${s.symbol}(${s.sector})`).join(', ')}.
Recommend 2 to consider and 1 to avoid. Use this exact format:
✅ BUY: [SYMBOL] — reason
👀 WATCH: [SYMBOL] — reason
⛔ AVOID: [SYMBOL] — reason
Then add one general trading tip starting with 💡.`;

    const text = await callOpenAI(prompt, 240, fallback);
    res.json({ text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
