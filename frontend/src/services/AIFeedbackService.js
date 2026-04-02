/**
 * AIFeedbackService.js — Module F
 * Live Gemini 1.5 Flash integration. All responses are real API calls.
 * Falls back to curated messages if API key is absent (prototype mode).
 */

const API_KEY  = import.meta.env.VITE_GEMINI_API_KEY;
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

async function callGemini(prompt, maxTokens = 300) {
  if (!API_KEY || API_KEY === 'your_actual_gemini_api_key_here') {
    return getFallback(prompt);
  }
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini error ${res.status}`);
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No response.';
}

/** Post-mortem analysis after a trade resolves. */
export async function generateTradeExplanation(trade) {
  const { symbol, direction, stake, multiplier, entryPrice, exitPrice, pointDelta, won } = trade;
  const pct = (((exitPrice - entryPrice) / entryPrice) * 100).toFixed(2);
  const prompt = `You are a friendly trading mentor in StockQuest, a gamified simulator.
User ${won ? 'WON' : 'LOST'} a trade:
- Stock: ${symbol} | Direction: ${direction.toUpperCase()} | Entry: $${entryPrice} → Exit: $${exitPrice} (${pct}%)
- Stake: ${stake} pts × ${multiplier}x → Outcome: ${pointDelta > 0 ? '+' : ''}${pointDelta} pts

Write 3 sentences: (1) why the stock moved, (2) what the user did right/wrong, (3) one actionable tip for next time.
Tone: encouraging, educational, concise. Light emojis OK.`;
  return callGemini(prompt, 280);
}

/** Personalised improvement tip based on trade stats. */
export async function getImprovementTip(stats) {
  const prompt = `You are a trading coach for StockQuest.
User stats — Win Rate: ${stats.winRate}% | Trades: ${stats.totalTrades} | Best sector: ${stats.bestSector || 'N/A'} | Avg multiplier: ${stats.avgMultiplier}x
Give one specific actionable tip in 2 sentences. Be direct and reference their stats.`;
  return callGemini(prompt, 180);
}

/** Answer any trading question from the AI chatbot. */
export async function answerTradingQuestion(question) {
  const prompt = `You are an expert stock trading tutor in StockQuest.
User asks: "${question}"
Answer in 2-3 sentences. Clear, simple language. End with one encouraging phrase.`;
  return callGemini(prompt, 220);
}

/** Stock recommendations based on portfolio. */
export async function getStockRecommendations(heldSymbols, available) {
  const prompt = `You are an AI stock advisor for StockQuest.
User holds: ${heldSymbols.join(', ') || 'nothing yet'}.
Available: ${available.map(s => `${s.symbol}(${s.sector})`).join(', ')}.
Recommend 2 to consider and 1 to avoid:
✅ BUY: [SYMBOL] — reason
✅ WATCH: [SYMBOL] — reason
⛔ AVOID: [SYMBOL] — reason
Keep each reason to one sentence.`;
  return callGemini(prompt, 220);
}

// ── Fallback responses (no API key) ──────────────────────────────────────────
const FALLBACKS = {
  explanation: [
    "📊 The stock moved on broader sector momentum. Your timing showed good instincts — next time, confirm your entry with RSI before placing the bet. Keep tracking your win rate to spot patterns!",
    "📈 Market sentiment drove this outcome. Watch for volume spikes before your next trade — high volume + price move = stronger signal. You're building great intuition!",
    "🧠 News flow influenced this move. Try cross-checking the Sentiment Panel before betting. Consistency and discipline beat luck every time!",
  ],
  tip: [
    "💡 Focus on one sector you understand well before diversifying. Specialised knowledge gives you an edge over random picks.",
    "💡 Lower your multiplier on your first few trades of the day. Warm up slowly and raise stakes as conviction grows.",
    "💡 Check the Crowd Intelligence panel before investing — when crowd + AI both agree, confidence is highest.",
  ],
  chat: "🤖 Great question! I'm running in offline mode right now. Add your Gemini API key to .env to unlock live AI answers. In the meantime, check the Learning Hub for detailed explanations!",
};

function getFallback(prompt) {
  if (prompt.includes('WON') || prompt.includes('LOST')) return FALLBACKS.explanation[Math.floor(Math.random() * 3)];
  if (prompt.includes('coach') || prompt.includes('tip'))  return FALLBACKS.tip[Math.floor(Math.random() * 3)];
  return FALLBACKS.chat;
}
