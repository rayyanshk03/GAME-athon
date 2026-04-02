/**
 * BacktestEngine.js — Module G
 * Replay historical stock data to simulate trade timing. Pure functions.
 */

export function runBacktest(priceHistory, { entryIndex = 0, direction = 'up', stake = 100, multiplier = 1 } = {}) {
  if (!priceHistory || priceHistory.length < 2) return { error: 'Insufficient price history.' };
  if (entryIndex >= priceHistory.length - 1)    return { error: 'Entry index out of range.' };

  const entryPrice = priceHistory[entryIndex].price;
  const exitPrice  = priceHistory[priceHistory.length - 1].price;
  const pctChange  = ((exitPrice - entryPrice) / entryPrice) * 100;
  const won        = direction === 'up' ? exitPrice > entryPrice : exitPrice < entryPrice;
  const rawDelta   = stake * (Math.abs(pctChange) / 100) * multiplier;
  const pointDelta = won ? Math.round(rawDelta) : -Math.min(stake, Math.round(rawDelta));

  const equity = priceHistory.slice(entryIndex).map((pt, i) => {
    const pct  = ((pt.price - entryPrice) / entryPrice) * 100;
    const w    = direction === 'up' ? pt.price >= entryPrice : pt.price <= entryPrice;
    const d    = stake * (Math.abs(pct) / 100) * multiplier;
    return { time: pt.time, price: pt.price, value: Math.round(stake + (w ? d : -d)), index: i };
  });

  const values     = equity.map(e => e.value - stake);
  return {
    entryPrice, exitPrice,
    pctChange: Math.round(pctChange * 100) / 100,
    won, pointDelta, equity,
    stats: {
      maxGain:     Math.round(Math.max(...values)),
      maxDrawdown: Math.round(Math.min(...values)),
      finalValue:  stake + pointDelta,
      roi:         Math.round((pointDelta / stake) * 100),
    },
  };
}

export function findOptimalEntry(priceHistory, direction = 'up') {
  if (!priceHistory?.length) return 0;
  return direction === 'up'
    ? priceHistory.reduce((best, pt, i) => pt.price < priceHistory[best].price ? i : best, 0)
    : priceHistory.reduce((best, pt, i) => pt.price > priceHistory[best].price ? i : best, 0);
}
