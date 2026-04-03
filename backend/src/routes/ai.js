/**
 * routes/ai.js — OpenAI proxy with rich offline fallbacks.
 * When OPENAI_API_KEY is missing, localRecommend / localTip / localExplain
 * generate useful content instead of a config error message.
 */
const router = require('express').Router();
const { callOpenAI, localRecommend, localExplain, localTip, localInsight } = require('../services/openaiService');
const { analyzeSentiment } = require('../services/FinbertService');

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
router.post('/chat', async (req, res) => {
  try {
    const { question } = req.body;
    const fallback = '💡 Combine the chart, RSI/trend signals, and Crowd+AI score before placing a bet. Check the Learning Hub for deeper lessons. You\'ve got this!';

    const prompt = `You are an expert stock trading tutor in StockQuest.
User asks: "${question}"
Answer in 2-3 sentences. Clear, simple language. End with one encouraging phrase.`;

    const text = await callOpenAI(prompt, 220, fallback);
    res.json({ text });
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

// POST /api/ai/sentiment  { articles: [{ headline: '', summary: '' }], symbol: 'AMZN' }
router.post('/sentiment', async (req, res) => {
  try {
    const { articles, symbol } = req.body;
    if (!articles || !articles.length) return res.json({ sentiments: [] });

    // Prepend the stock symbol so FinBERT evaluates sentiment *towards that stock*
    const newsList = articles.map(a => {
      const text = `${symbol || ''} stock: ${a.headline}`;
      return text;
    });
    
    // Call FinBERT (via Hugging Face) for professional financial sentiment
    const sentiments = await analyzeSentiment(newsList);
    
    res.json({ sentiments });
  } catch (err) {
    console.error('Sentiment Analysis Error:', err);
    res.json({ sentiments: [] });
  }
});

// POST /api/ai/insight  { symbol: '', price: 0, rsi: 0, trend: '' }
router.post('/insight', async (req, res) => {
  try {
    const { symbol, price, rsi, trend } = req.body;
    const fallback = localInsight({ symbol, price, rsi, trend });
    
    let technicalContext = '';
    if (rsi) technicalContext += `RSI is ${rsi}. `;
    if (trend) technicalContext += `Trend is ${trend}.`;

    const prompt = `You are a trading coach in StockQuest. 
User selected ${symbol} trading at $${price}. ${technicalContext}
Write exactly 2 sentences analyzing the risk and potential direction. Keep it concise, educational, and engaging. Do NOT make a definitive price prediction.`;

    const text = await callOpenAI(prompt, 150, fallback);
    res.json({ text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
