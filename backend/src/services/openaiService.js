/**
 * services/openaiService.js
 * Centralised OpenAI caller with rich offline fallbacks.
 */
const API_KEY  = process.env.OPENAI_API_KEY;
const ENDPOINT = `https://api.openai.com/v1/chat/completions`;

// ── Rich offline fallback library ─────────────────────────────────────
const OFFLINE_TIPS = [
  '💡 Specialise in one or two sectors before diversifying — depth beats breadth in the early stages.',
  '📊 RSI below 30 signals oversold conditions. Bold traders buy here; cautious ones wait for the bounce.',
  '⚡ High-multiplier bets should represent no more than 10–15% of your total points. Manage risk first.',
  '📈 Stocks that outperform in earnings seasons tend to continue for 1–2 weeks post-announcement.',
  '🧠 The crowd is often wrong at extremes. When sentiment is 80%+ bullish, consider the contrarian side.',
  '🔄 Even pros lose 40% of trades. What separates winners is the size of their wins vs. their losses.',
  '⏱️ Time in the market beats timing the market. Patience is the most underrated trading skill.',
  '🎯 Before placing a bet, define your exit: target price AND stop-loss. Entry is only half the plan.',
];

function localRecommend(heldSymbols = [], available = []) {
  const notHeld  = available.filter(s => !heldSymbols.includes(s.symbol));
  const held     = available.filter(s =>  heldSymbols.includes(s.symbol));
  const holding  = held.length > 0 ? `You're already positioned in **${held.map(s => s.symbol).join(', ')}**.` : "You haven't placed any bets yet — a clean slate.";

  const buy   = notHeld[0] || available[0] || { symbol: 'MSFT', sector: 'Technology' };
  const watch = notHeld[1] || available[1] || { symbol: 'AAPL', sector: 'Technology' };
  const avoid = notHeld[2] || available[2] || { symbol: 'TSLA', sector: 'Consumer' };

  const tip = OFFLINE_TIPS[Math.floor(Math.random() * OFFLINE_TIPS.length)];

  return `🤖 AI Market Brief\n${holding}\n\n✅ BUY: ${buy.symbol} — ${buy.sector || 'Equity'} momentum is building; technicals support an upward move.\n👀 WATCH: ${watch.symbol} — Mixed signals; let it consolidate before committing points.\n⛔ AVOID: ${avoid.symbol} — Above-average volatility this week; risk-reward unattractive.\n\n${tip}`;
}

function localExplain(trade) {
  const { symbol, direction, won, pct, pointDelta, multiplier } = trade;
  const result  = won ? 'WON' : 'LOST';
  const phrases = won
    ? [ `${symbol} gained momentum driven by sector rotation and strong buying pressure.`,
        `Your ${direction} call was well-timed — you identified the trend early.`,
        `Next step: try the same setup on a correlated stock to compound this edge.` ]
    : [ `${symbol} moved against the ${direction} thesis on broader market pressure.`,
        `The entry looked valid but macroeconomic headwinds short-circuited the move.`,
        `Tip: set a tighter stop at 0.8× entry next time to protect against unexpected reversals.` ];
  return `📊 ${result} (${pct > 0 ? '+' : ''}${pct}%) on ${symbol}×${multiplier}x → ${pointDelta > 0 ? '+' : ''}${pointDelta} pts\n${phrases.join(' ')}`;
}

function localTip(stats) {
  const { winRate = 50, totalTrades = 0, bestSector = 'Technology', avgMultiplier = 1 } = stats;
  if (totalTrades === 0) return '💡 Place your first bet to unlock personalised coaching. Start with 1× multiplier to learn the patterns risk-free.';
  if (winRate > 65)  return `🔥 ${winRate}% win rate — impressive! Consider moving to 2× multiplier on your highest-conviction ${bestSector} picks.`;
  if (winRate < 40)  return `📉 ${winRate}% win rate suggests entry timing needs work. Try waiting for RSI < 40 before pressing BUY.`;
  if (avgMultiplier > 2) return '⚠️ High average multiplier detected. Dial back to 1–2× on uncertain setups — consistency beats big swings.';
  return `✅ Solid ${winRate}% win rate with ${totalTrades} trades. Your edge is in ${bestSector} — keep specialising and raise stake size gradually.`;
}

function localInsight(data) {
  const { symbol, price, rsi, trend } = data;
  const isOversold = rsi && rsi < 40;
  const isOverbought = rsi && rsi > 60;
  
  if (isOversold) {
    return `📈 ${symbol} is trading near $${price} and looks oversold (RSI: ${rsi}). This could present a favorable risk/reward setup for an upward bounce if the trend stabilizes.`;
  } else if (isOverbought) {
    return `📉 ${symbol} currently at $${price} appears technically overbought (RSI: ${rsi}). Buyers should be cautious as a pullback may be imminent before further continuation.`;
  } else {
    return `⚖️ ${symbol} is at $${price} with mixed technicals (RSI: ${rsi || 'N/A'}, Trend: ${trend || 'Neutral'}). Wait for a clearer momentum shift before taking a large position.`;
  }
}

async function callOpenAI(prompt, maxTokens = 300, fallback = null) {
  if (!API_KEY || API_KEY === 'your_actual_openai_api_key_here') {
    return fallback ?? OFFLINE_TIPS[Math.floor(Math.random() * OFFLINE_TIPS.length)];
  }

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    if (res.status === 429 || res.status === 503) {
      return fallback ?? '📌 OpenAI rate-limited. Showing cached insights.';
    }
    throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? 'No response.';
}

module.exports = { callOpenAI, localRecommend, localExplain, localTip, localInsight };
