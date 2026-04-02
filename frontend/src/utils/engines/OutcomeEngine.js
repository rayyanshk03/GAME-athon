/**
 * OutcomeEngine.js — Frontend utility (ES module)
 * Pure math — no API keys, no secrets.
 */

export function calculateOutcome(entryPrice, exitPrice, stake, multiplier = 1, direction = 'up') {
  const percentMove = ((exitPrice - entryPrice) / entryPrice) * 100;
  const won = direction === 'up' ? exitPrice > entryPrice : exitPrice < entryPrice;
  const rawDelta = stake * (Math.abs(percentMove) / 100) * multiplier;
  const pointDelta = won ? Math.round(rawDelta) : -Math.min(stake, Math.round(rawDelta));
  return { pointDelta, percentMove, won };
}

export function resolveTimedBet(bet, currentPrice) {
  const durations = { '15m': 9e5, '1h': 36e5, '1d': 864e5 };
  const duration = durations[bet.duration] || durations['1h'];
  const elapsed = Date.now() - bet.placedAt;
  if (elapsed < duration) return { resolved: false, timeLeft: duration - elapsed, progress: elapsed / duration };
  return { resolved: true, ...calculateOutcome(bet.entryPrice, currentPrice, bet.stake, bet.multiplier, bet.direction) };
}

export function getMaxStake(totalPoints, riskProfile) {
  const limits = { safe: 0.10, balanced: 0.25, aggressive: 0.50 };
  return Math.max(10, Math.floor(totalPoints * (limits[riskProfile] || 0.25)));
}

export function validateBet({ stake, points, maxStake, minStake = 10 }) {
  if (!stake || isNaN(stake)) return { valid: false, error: 'Enter a valid stake.' };
  if (stake < minStake)       return { valid: false, error: `Minimum stake is ${minStake} pts.` };
  if (stake > points)         return { valid: false, error: 'Insufficient points.' };
  if (stake > maxStake)       return { valid: false, error: `Max stake for your risk profile: ${maxStake} pts.` };
  return { valid: true };
}

export function checkSmartAlert(entryPrice, currentPrice, threshold = 2) {
  const pct = ((currentPrice - entryPrice) / entryPrice) * 100;
  return Math.abs(pct) >= threshold ? pct : null;
}

export function rollDoubleOrNothing() {
  return Math.random() > 0.5 ? 2 : 0;
}
