/**
 * routes/ai.js
 * All AI endpoints — each one is ISOLATED.
 * Every route uses Gemini 2.0 Flash with its own specific prompt.
 * No endpoint shares state or calls with any other endpoint.
 *
 * Routes:
 *   POST /api/ai/chat       → AI finance chatbot (RAG → Gemini → local KB)
 *   POST /api/ai/insight    → Stock-specific market insight (Gemini only)
 *   POST /api/ai/recommend  → Portfolio recommendations (Gemini only)
 *   POST /api/ai/explain    → Trade result explanation (Gemini only)
 *   POST /api/ai/tip        → Personalised trading tip (Gemini only)
 *   POST /api/ai/sentiment  → News sentiment via FinBERT (Gemini fallback)
 */
const router = require('express').Router();
const { callGemini } = require('../services/geminiService');
const { askRAG, localFinanceAnswer } = require('../services/ragService');
const { analyzeSentiment } = require('../services/FinbertService');

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/ai/chat  { question: string }
//  PURPOSE: General finance chatbot. Cascade: RAG → Gemini → local KB
//  ISOLATED: Only this route uses RAG or answers general finance questions.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/chat', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question?.trim()) return res.status(400).json({ error: 'question is required' });

    // Step 1: Try RAG API (finance-retrieval augmented generation)
    try {
      const ragAnswer = await askRAG(question);
      if (ragAnswer?.trim()) {
        console.log(`[chat/RAG] ✅ "${question.slice(0, 50)}"`);
        return res.json({ text: ragAnswer, source: 'rag' });
      }
    } catch (ragErr) {
      console.warn(`[chat/RAG] ❌ RAG unavailable: ${ragErr.message}`);
    }

    // Step 2: Try Gemini with a finance-tuned prompt
    const prompt = `You are an expert financial educator inside StockQuest, a gamified stock trading simulator.

A student just asked: "${question}"

Answer clearly and educationally in 3-5 sentences. Cover:
- The core definition or concept
- How it applies to real trading decisions
- One practical tip the student can apply immediately

Keep language simple. If asked about a live stock price, explain you don't have real-time data but describe the concept instead.`;

    const localFallback = localFinanceAnswer(question);
    const text = await callGemini(prompt, localFallback, 400);
    console.log(`[chat/Gemini] ✅ "${question.slice(0, 50)}"`);
    res.json({ text, source: 'gemini' });

  } catch (err) {
    console.error('[chat] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/ai/insight  { symbol, price, rsi, trend }
//  PURPOSE: Stock-specific technical analysis insight card.
//  ISOLATED: Uses Gemini only. No RAG, no chatbot logic.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/insight', async (req, res) => {
  try {
    const { symbol, price, rsi, trend } = req.body;

    const localFallback = (() => {
      if (rsi && rsi < 35) return `📈 ${symbol} appears oversold (RSI: ${rsi}) near $${price}. A bounce is possible if broader market conditions support it — watch volume closely before entering.`;
      if (rsi && rsi > 65) return `📉 ${symbol} looks overbought (RSI: ${rsi}) at $${price}. Consider waiting for a pullback before opening a new position to improve risk/reward.`;
      return `⚖️ ${symbol} at $${price} shows mixed signals (RSI: ${rsi || 'N/A'}, Trend: ${trend || 'Neutral'}). Wait for a clearer directional break before committing significant position size.`;
    })();

    const prompt = `You are a concise market analyst inside StockQuest trading simulator.

Stock: ${symbol} | Current Price: $${price}
RSI: ${rsi || 'unavailable'} | Trend: ${trend || 'Neutral'}

Write exactly 2 sentences:
1. Interpret the technical signals for this specific stock (RSI level, trend direction, risk).
2. Give ONE clear actionable suggestion for a trader right now.

Be specific, direct, and educational. No generic advice.`;

    const text = await callGemini(prompt, localFallback, 180);
    console.log(`[insight/Gemini] ✅ ${symbol}`);
    res.json({ text });

  } catch (err) {
    console.error('[insight] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/ai/recommend  { heldSymbols: [], available: [] }
//  PURPOSE: AI portfolio recommendations panel.
//  ISOLATED: Uses Gemini only. No chatbot, no RAG.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/recommend', async (req, res) => {
  try {
    const { heldSymbols = [], available = [] } = req.body;

    const notHeld = available.filter(s => !heldSymbols.includes(s.symbol));
    const buy     = notHeld[0] || available[0] || { symbol: 'MSFT', sector: 'Technology' };
    const watch   = notHeld[1] || available[1] || { symbol: 'AAPL', sector: 'Technology' };
    const avoid   = notHeld[2] || available[2] || { symbol: 'TSLA', sector: 'Consumer' };

    const localFallback = `🤖 AI Market Brief\n${heldSymbols.length > 0 ? `You hold: ${heldSymbols.join(', ')}.` : "No active positions."}\n\n✅ BUY: ${buy.symbol} — Sector momentum building; technicals support upward move.\n👀 WATCH: ${watch.symbol} — Mixed signals; let it consolidate first.\n⛔ AVOID: ${avoid.symbol} — Above-average volatility; unattractive risk/reward.\n\n💡 Tip: Specialise in 1–2 sectors first before diversifying broadly.`;

    const prompt = `You are an AI stock advisor inside StockQuest, a gamified trading simulator.

The user currently holds: ${heldSymbols.join(', ') || 'no positions yet'}.
Available stocks: ${available.map(s => `${s.symbol} (${s.sector || 'Equity'})`).join(', ') || 'AAPL, GOOGL, TSLA, MSFT, AMZN'}.

Respond using EXACTLY this format (no extra text before or after):
✅ BUY: [SYMBOL] — [specific reason based on sector/momentum in 8 words max]
👀 WATCH: [SYMBOL] — [specific reason in 8 words max]  
⛔ AVOID: [SYMBOL] — [specific reason in 8 words max]

💡 [One actionable trading tip in 1 sentence]`;

    const text = await callGemini(prompt, localFallback, 250);
    console.log(`[recommend/Gemini] ✅ holds=${heldSymbols.join(',')}`);
    res.json({ text });

  } catch (err) {
    console.error('[recommend] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/ai/explain  { trade: {} }
//  PURPOSE: Deep 5-section trade post-mortem with structured AI analysis.
//  ISOLATED: Uses Gemini only. No chat, no RAG, no recommendations.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/explain', async (req, res) => {
  try {
    const { trade } = req.body;
    const {
      symbol, direction, stake, multiplier,
      entryPrice, exitPrice, pointDelta, won,
      sector = 'Equity', placedAt, resolvedAt,
    } = trade;

    const pct      = (((exitPrice - entryPrice) / entryPrice) * 100).toFixed(2);
    const absPct   = Math.abs(parseFloat(pct));
    const holdMins = placedAt && resolvedAt
      ? Math.round((resolvedAt - placedAt) / 60000)
      : null;
    const holdStr  = holdMins != null
      ? holdMins < 60 ? `${holdMins} min` : `${(holdMins / 60).toFixed(1)} hr`
      : 'short-term';
    const riskRating = multiplier >= 3 ? 'HIGH' : multiplier === 2 ? 'MEDIUM' : 'LOW';
    const efficiency = won
      ? (absPct > 5 ? 'Excellent capture' : absPct > 2 ? 'Good capture' : 'Marginal gain')
      : (absPct > 5 ? 'Large drawdown' : absPct > 2 ? 'Moderate loss' : 'Small loss');

    const localFallback = won
      ? `## 📈 Market Context\n${symbol} benefited from strong ${sector} sector momentum, moving ${pct}% during your ${holdStr} hold. Macro tailwinds and sector rotation likely drove the move in your favour.\n\n## ✅ Decision Quality\nYour ${direction.toUpperCase()} call at $${entryPrice} with a ${multiplier}× multiplier was well-executed. Exiting at $${exitPrice} (${pct}%) resulted in a clean ${efficiency}.\n\n## ⚖️ Risk Assessment\nRisk Level: ${riskRating} — Stake: ${stake} pts × ${multiplier}× — Hold: ${holdStr}. Position sizing was ${multiplier <= 2 ? 'conservative and appropriate for this setup' : 'aggressive — justified by outcome but monitor carefully on future trades'}.\n\n## 🔍 Missed Opportunities\nEven this win could have been optimised: confirm entries with RSI < 40 on BUY setups and use volume spikes as confluence. A tighter hold target could have avoided late-game volatility.\n\n## 🎯 Action Plan\n1. Identify similar ${sector} momentum setups when the sector ETF trends above its 20-day MA.\n2. Document this winning setup in your trade journal — replicate the pattern.\n3. Next time consider ${multiplier < 3 ? `raising to ${multiplier + 1}×` : 'maintaining 3×'} only when RSI and trend both confirm within 1 hour of entry.`
      : `## 📉 Market Context\n${symbol} moved ${absPct.toFixed(2)}% against your ${direction} thesis in the ${sector} sector over ${holdStr}. Likely catalysts include sector headwinds, macro uncertainty, or a technical reversion from overbought/oversold levels.\n\n## ❌ Decision Quality\nYour ${direction.toUpperCase()} entry at $${entryPrice} was not rewarded — price moved to $${exitPrice} (${pct}%). The ${multiplier}× multiplier amplified the loss to ${pointDelta} pts. Re-evaluate whether the trend, RSI, and sector momentum were all clearly aligned at entry.\n\n## ⚖️ Risk Assessment\nRisk Level: ${riskRating} — Stake: ${stake} pts × ${multiplier}× — Hold: ${holdStr}. ${multiplier >= 3 ? 'The 3× multiplier significantly accelerated the loss. Reserve this level for only the highest-conviction setups.' : 'Position sizing was reasonable, but the directional thesis needed more confirmation before entry.'}\n\n## 🔍 Key Mistake\nBefore a ${direction.toUpperCase()} position, three signals should align: (1) RSI trending in your direction, (2) price above/below key moving average, (3) sector ETF supporting the move. Missing even one of these increases loss probability significantly.\n\n## 🎯 Action Plan\n1. Paper-trade ${symbol} ${direction === 'up' ? 'BUY' : 'SELL'} setups for 3 sessions before using real stake.\n2. Lower multiplier to 1× on ${symbol} until your personal win rate on this stock crosses 55%.\n3. Set an entry rule: only go ${direction} when RSI is ${direction === 'up' ? '< 50 and rising with above-average volume' : '> 50 and falling with above-average selling volume'}.`;

    const prompt = `You are an expert trading mentor inside StockQuest, a gamified stock simulator. Write a detailed, structured trade post-mortem analysis.

TRADE DATA:
- Symbol: ${symbol} (${sector} sector)
- Direction: ${direction.toUpperCase()} | Result: ${won ? 'WIN ✅' : 'LOSS ❌'}
- Entry: $${entryPrice} → Exit: $${exitPrice} | Move: ${pct}%
- Stake: ${stake} pts × ${multiplier}× → ${pointDelta > 0 ? '+' : ''}${pointDelta} pts
- Hold Duration: ${holdStr} | Risk Level: ${riskRating} | Outcome Quality: ${efficiency}

Write EXACTLY 5 sections using these EXACT headers (include ## and emoji):

## 📈 Market Context
2-3 sentences: Why did ${symbol} move ${pct}% in the ${sector} sector? Reference likely macro drivers, sector rotation, earnings cycle position, or key technical levels. Be specific — no generic statements.

## ${won ? '✅' : '❌'} Decision Quality
2-3 sentences: Evaluate the ${direction.toUpperCase()} call quality. Was entry timing correct? Was the ${multiplier}× multiplier appropriate for this setup? Was this a disciplined play or a speculative bet?

## ⚖️ Risk Assessment
2-3 sentences: Assess the risk profile. Comment on the ${multiplier}× multiplier choice, the ${holdStr} hold duration, and the stake-to-reward ratio. Was this risk calibrated correctly?

## 🔍 ${won ? 'Missed Opportunity' : 'Key Mistake'}
2-3 sentences: Identify ONE specific signal that was either missed (loss) or could have improved performance (win). Name a concrete indicator — RSI level, volume pattern, support/resistance zone, or sector ETF signal. Be precise.

## 🎯 Action Plan
List EXACTLY 3 numbered, specific, actionable steps before the next ${symbol} or ${sector} trade. Each step = 1 concrete sentence starting with a verb.

Rules:
- Total: 220-350 words
- Educational, specific, mentoring tone
- Never be generic — always reference the actual trade data
- No filler phrases like "great job" or "well done"`;

    const text = await callGemini(prompt, localFallback, 700);
    console.log(`[explain/Gemini] ✅ ${symbol} ${won ? 'WIN' : 'LOSS'} ${pct}%`);
    res.json({ text });

  } catch (err) {
    console.error('[explain] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/ai/tip  { stats: {} }
//  PURPOSE: Personalised coaching tip based on user's trading stats.
//  ISOLATED: Uses Gemini only. No chatbot or market analysis.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/tip', async (req, res) => {
  try {
    const { stats } = req.body;
    const { winRate = 50, totalTrades = 0, bestSector = 'Technology', avgMultiplier = 1 } = stats || {};

    const localFallback = (() => {
      if (totalTrades === 0) return '💡 Place your first bet to unlock personalised coaching. Start with 1× multiplier to learn patterns risk-free.';
      if (winRate > 65)  return `🔥 ${winRate}% win rate — impressive! Consider 2× multiplier on your highest-conviction ${bestSector} picks.`;
      if (winRate < 40)  return `📉 ${winRate}% win rate suggests entry timing needs work. Wait for RSI < 40 before pressing BUY.`;
      if (avgMultiplier > 2) return '⚠️ High average multiplier detected. Dial back to 1–2× on uncertain setups.';
      return `✅ Solid ${winRate}% win rate across ${totalTrades} trades. Keep specialising in ${bestSector} and raise stake size gradually.`;
    })();

    const prompt = `You are a personalised trading coach in StockQuest.

Trader statistics:
- Win Rate: ${winRate}%
- Total Trades: ${totalTrades}
- Best Sector: ${bestSector || 'N/A'}
- Average Multiplier Used: ${avgMultiplier}x

Write ONE specific, actionable coaching tip in exactly 2 sentences.
Base the tip directly on their stats — don't give generic advice.
If they have 0 trades, encourage them to start with low risk.`;

    const text = await callGemini(prompt, localFallback, 180);
    console.log(`[tip/Gemini] ✅ winRate=${winRate}% trades=${totalTrades}`);
    res.json({ text });

  } catch (err) {
    console.error('[tip] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/ai/sentiment  { articles: [], symbol: '' }
//  PURPOSE: Financial news sentiment scoring via FinBERT.
//  ISOLATED: Uses FinBERT (Hugging Face). Gemini is NOT used here.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/sentiment', async (req, res) => {
  try {
    const { articles, symbol } = req.body;
    if (!articles || !articles.length) return res.json({ sentiments: [] });

    const newsList = articles.map(a => `${symbol || ''} stock: ${a.headline}`);
    const sentiments = await analyzeSentiment(newsList);
    res.json({ sentiments });

  } catch (err) {
    console.error('[sentiment] Error:', err.message);
    res.json({ sentiments: [] });
  }
});


module.exports = router;
