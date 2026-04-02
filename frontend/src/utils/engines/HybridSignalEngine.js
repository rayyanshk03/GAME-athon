/**
 * HybridSignalEngine.js — Frontend utility (ES module)
 * Pure math — no API keys, no secrets.
 */

export function computeHybridScore(voteData, aiSentiment = 0) {
  const { bullish = 0, bearish = 0 } = voteData;
  const total = bullish + bearish;
  const crowdScore = total === 0 ? 50 : (bullish / total) * 100;
  const aiScore    = ((aiSentiment + 1) / 2) * 100;
  const hybrid     = crowdScore * 0.6 + aiScore * 0.4;
  const direction  = hybrid > 55 ? 'bullish' : hybrid < 45 ? 'bearish' : 'neutral';
  const confidence = (hybrid > 75 || hybrid < 25) ? 'high' : (hybrid > 65 || hybrid < 35) ? 'moderate' : 'low';
  return { score: Math.round(hybrid), direction, confidence, crowdScore: Math.round(crowdScore), aiScore: Math.round(aiScore) };
}

export function resolveContest(room, currentPrices) {
  if (!room?.participants?.length) return null;
  const results = room.participants
    .map(p => {
      const cur = currentPrices[p.symbol] ?? p.entryPrice;
      const pct = ((cur - p.entryPrice) / p.entryPrice) * 100;
      const won = p.direction === 'up' ? pct > 0 : pct < 0;
      return { ...p, pct, won };
    })
    .sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));
  return { winner: results[0], results, resolved: true };
}

export function getSimModeConfig(mode) {
  return {
    beginner: { label: 'Beginner', volatility: 0.005, maxMultiplier: 1, color: '#10b981',
                desc: 'Low-volatility picks. Perfect for learning the basics.' },
    pro:      { label: 'Pro',      volatility: 0.025, maxMultiplier: 3, color: '#3b82f6',
                desc: 'Real market conditions. All stocks, all multipliers.' },
    event:    { label: 'Event',    volatility: 0.05,  maxMultiplier: 3, color: '#f59e0b',
                desc: 'High-impact events: Earnings Day · Budget Season.' },
  }[mode] || {};
}
