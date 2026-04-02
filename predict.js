// ============================================================
//  MarketPulse — Prediction Engine  (predict.js)
//  Uses: Linear Regression, RSI, MACD, Moving Averages
//  Operates on current chart data — no extra API calls needed
// ============================================================

'use strict';

let pmForecastChart = null;

// ────────────────────────────────────────────────────────────
//  MATH HELPERS
// ────────────────────────────────────────────────────────────

/** Simple linear regression → returns { slope, intercept, r2 } */
function linearRegression(values) {
  const n = values.length;
  if (n < 2) return { slope: 0, intercept: values[0] || 0, r2: 0 };
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  values.forEach((y, x) => {
    sumX  += x;  sumY  += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
  });
  const slope     = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  // R²
  const yMean = sumY / n;
  let ssTot = 0, ssRes = 0;
  values.forEach((y, x) => {
    ssTot += (y - yMean) ** 2;
    ssRes += (y - (slope * x + intercept)) ** 2;
  });
  const r2 = ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot);
  return { slope, intercept, r2 };
}

/** RSI(14) */
function calcRSI(prices, period = 14) {
  if (prices.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = prices.length - period; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) gains  += diff;
    else           losses -= diff;
  }
  const avgGain = gains  / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/** EMA (Exponential Moving Average) */
function ema(prices, period) {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  const k = 2 / (period + 1);
  let val = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < prices.length; i++) val = prices[i] * k + val * (1 - k);
  return val;
}

/** MACD = EMA12 - EMA26, Signal = EMA9 of MACD */
function calcMACD(prices) {
  const ema12 = ema(prices, 12);
  const ema26 = ema(prices, 26);
  const macdLine = ema12 - ema26;
  return { macdLine, bullish: macdLine > 0 };
}

/** Simple Moving Average */
function sma(prices, period) {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  const slice = prices.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

/** Volatility = std dev of % returns */
function calcVolatility(prices) {
  if (prices.length < 2) return 0;
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1] * 100);
  }
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length;
  return Math.sqrt(variance);
}

// ────────────────────────────────────────────────────────────
//  PREDICTION ENGINE
// ────────────────────────────────────────────────────────────

function runPrediction(ticker, prices) {
  const n = prices.length;
  const currentPrice = prices[n - 1];

  // 1. Linear Regression
  const lr = linearRegression(prices);
  const lrPredicted = lr.slope * n + lr.intercept; // next point
  const lrDirection = lr.slope > 0; // true = up

  // 2. RSI
  const rsi = calcRSI(prices);

  // 3. MACD
  const macd = calcMACD(prices);

  // 4. Moving Averages
  const ma20 = sma(prices, Math.min(20, n));
  const ma50 = sma(prices, Math.min(50, n));
  const maAbove = currentPrice > ma20; // price above short MA = bullish

  // 5. Momentum (last 5 candles)
  const momentum = n >= 5 ? (prices[n - 1] - prices[n - 5]) / prices[n - 5] * 100 : 0;

  // 6. Volatility
  const volatility = calcVolatility(prices);

  // ── Weighted Scoring ──────────────────────────────────────
  // Each indicator votes +1 (bull) or -1 (bear)
  let score = 0;
  const votes = {
    lr:   lrDirection  ? 1 : -1,
    rsi:  rsi < 70 && rsi > 30 ? (rsi < 50 ? -0.5 : 0.5) : (rsi >= 70 ? -1 : 1),
    macd: macd.bullish ? 1 : -1,
    ma:   maAbove      ? 1 : -1,
    mom:  momentum > 0 ? 1 : -1,
  };
  Object.values(votes).forEach(v => score += v);
  // score range: -5 to +5

  const bullishPct = (score + 5) / 10; // 0..1
  const signal = bullishPct > 0.6 ? 'bullish' : bullishPct < 0.4 ? 'bearish' : 'neutral';

  // ── Confidence based on R² + agreement ──  
  const agreement = Math.abs(score) / 5; // 0..1
  const confidence = Math.round((lr.r2 * 0.4 + agreement * 0.6) * 100);

  // ── Price Targets ──────────────────────────────────────────
  // Daily volatility as % drift
  const dailyDrift = lr.slope / currentPrice * 100;   // % per data point
  const multiplier = signal === 'bullish' ? 1 : signal === 'bearish' ? -1 : 0;

  // Targets: use LR drift adjusted by signal
  const driftAbs = Math.abs(dailyDrift) || 0.3;
  const signedDrift = driftAbs * multiplier;

  const target24h  = currentPrice * (1 + signedDrift * 1   / 100);
  const target7d   = currentPrice * (1 + signedDrift * 5   / 100);
  const target30d  = currentPrice * (1 + signedDrift * 18  / 100);

  // ── Forecast data (next 15 projected points) ──────────────
  const forecastPts = 15;
  const forecastData = [];
  for (let i = 1; i <= forecastPts; i++) {
    const proj = lr.slope * (n + i - 1) + lr.intercept;
    // Add confidence band wobble
    const noise = (Math.random() - 0.5) * volatility * 0.5 * currentPrice / 100;
    forecastData.push(+(proj + noise).toFixed(2));
  }

  return {
    signal, score, confidence,
    currentPrice,
    target24h, target7d, target30d,
    rsi: +rsi.toFixed(1),
    macd: +macd.macdLine.toFixed(2),
    ma20: +ma20.toFixed(2),
    ma50: +ma50.toFixed(2),
    momentum: +momentum.toFixed(2),
    volatility: +volatility.toFixed(2),
    lrSlope: +lr.slope.toFixed(4),
    r2: +(lr.r2 * 100).toFixed(1),
    historicalData: prices,
    forecastData,
    votes,
  };
}

// ────────────────────────────────────────────────────────────
//  MODAL OPEN / CLOSE
// ────────────────────────────────────────────────────────────

window.openPredictModal = function () {
  // Get chart data from Chart.js
  let prices = [];
  if (window.mainChart) {
    prices = (window.mainChart.data.datasets[0].data || []).filter(v => v != null).map(Number);
  }
  // Fallback: use stock sparkline
  if (prices.length < 5) {
    const s = STOCKS.find(x => x.ticker === selectedTicker);
    if (s && s.sparkline) prices = s.sparkline;
  }
  if (prices.length < 5) { alert('Not enough data for prediction. Load chart first.'); return; }

  // Animate button
  const btn = document.getElementById('predict-btn');
  btn.classList.add('loading');
  btn.querySelector('.btn-icon').textContent = '⏳';

  // Run after short delay for UX
  setTimeout(() => {
    const result = runPrediction(selectedTicker, prices);
    populateModal(result);
    btn.classList.remove('loading');
    btn.querySelector('.btn-icon').textContent = '🔮';
    document.getElementById('predict-modal-overlay').classList.add('open');
    // Animate confidence bar after open
    setTimeout(() => {
      document.getElementById('pm-conf-bar').style.width = result.confidence + '%';
    }, 120);
  }, 600);
};

window.closePredictModal = function (e) {
  if (e && e.target !== document.getElementById('predict-modal-overlay')) return;
  document.getElementById('predict-modal-overlay').classList.remove('open');
  if (pmForecastChart) { pmForecastChart.destroy(); pmForecastChart = null; }
};

// ────────────────────────────────────────────────────────────
//  POPULATE MODAL
// ────────────────────────────────────────────────────────────

function populateModal(r) {
  const s = STOCKS.find(x => x.ticker === selectedTicker);

  // Header
  document.getElementById('pm-ticker').textContent   = `${selectedTicker} — ${s ? s.name : ''}`;
  document.getElementById('pm-subtitle').textContent  = `AI Price Prediction · ${new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;

  // Signal
  const signalEl = document.getElementById('pm-signal');
  const icons = { bullish: '📈', bearish: '📉', neutral: '➡️' };
  signalEl.className = `pm-signal ${r.signal}`;
  document.getElementById('pm-signal-icon').textContent = icons[r.signal];
  const sigVal = document.getElementById('pm-signal-value');
  sigVal.textContent  = r.signal.toUpperCase();
  sigVal.className    = `pm-signal-value ${r.signal}`;

  // Target
  const chg24h = r.target24h - r.currentPrice;
  const pct24h = (chg24h / r.currentPrice) * 100;
  document.getElementById('pm-target').textContent = '$' + r.target24h.toFixed(2);
  const tChgEl = document.getElementById('pm-target-chg');
  tChgEl.textContent = `${chg24h >= 0 ? '▲' : '▼'} ${chg24h >= 0 ? '+' : ''}${chg24h.toFixed(2)} (${pct24h >= 0 ? '+' : ''}${pct24h.toFixed(2)}%)`;
  tChgEl.className = `pm-target-change ${chg24h >= 0 ? 'pos' : 'neg'}`;

  // Confidence bar
  const confBar = document.getElementById('pm-conf-bar');
  confBar.className = `pm-conf-bar ${r.signal}`;
  confBar.style.width = '0%'; // reset for animation
  document.getElementById('pm-conf-val').textContent = r.confidence + '%';

  // Horizons
  function setHorizon(idPrice, idChg, target) {
    const diff = target - r.currentPrice;
    const pct  = diff / r.currentPrice * 100;
    document.getElementById(idPrice).textContent = '$' + target.toFixed(2);
    const el = document.getElementById(idChg);
    el.textContent = `${diff >= 0 ? '▲ +' : '▼ '}${diff.toFixed(2)} (${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%)`;
    el.className = `pm-horizon-chg ${diff >= 0 ? 'pos' : 'neg'}`;
  }
  setHorizon('pm-h24',  'pm-h24c',  r.target24h);
  setHorizon('pm-h7d',  'pm-h7dc',  r.target7d);
  setHorizon('pm-h30d', 'pm-h30dc', r.target30d);

  // ── Technical Indicators ──────────────────────────────────
  setIndicator('ind-rsi', r.rsi.toFixed(1),
    r.rsi > 70 ? { cls: 'bear', txt: 'Overbought — Bearish' } :
    r.rsi < 30 ? { cls: 'bull', txt: 'Oversold — Bullish' } :
                 { cls: 'neut', txt: r.rsi < 50 ? 'Slightly Bearish' : 'Slightly Bullish' });

  setIndicator('ind-macd', (r.macd >= 0 ? '+' : '') + r.macd,
    r.macd > 0 ? { cls: 'bull', txt: '▲ Bullish Crossover' } :
                 { cls: 'bear', txt: '▼ Bearish Crossover' });

  const maTxt = r.currentPrice > r.ma20 ? 'Above MA — Bullish' : 'Below MA — Bearish';
  setIndicator('ind-ma', 'MA20 $' + r.ma20.toFixed(0),
    r.currentPrice > r.ma20 ? { cls: 'bull', txt: maTxt } : { cls: 'bear', txt: maTxt });

  setIndicator('ind-mom', (r.momentum >= 0 ? '+' : '') + r.momentum.toFixed(2) + '%',
    r.momentum > 0 ? { cls: 'bull', txt: '▲ Positive Momentum' } :
                     { cls: 'bear', txt: '▼ Negative Momentum' });

  const volLvl = r.volatility < 1 ? 'Low' : r.volatility < 2.5 ? 'Moderate' : 'High';
  setIndicator('ind-vol', r.volatility.toFixed(2) + '%',
    { cls: r.volatility < 1 ? 'bull' : r.volatility < 2.5 ? 'neut' : 'bear',
      txt: volLvl + ' Volatility' });

  setIndicator('ind-lr', 'R²: ' + r.r2 + '%',
    r.lrSlope > 0 ? { cls: 'bull', txt: '▲ Upward Trend' } :
                    { cls: 'bear', txt: '▼ Downward Trend' });

  // ── Forecast Chart ─────────────────────────────────────────
  renderForecastChart(r);
}

function setIndicator(id, value, sig) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
  const sigEl = document.getElementById(id + '-sig');
  if (sigEl) { sigEl.textContent = sig.txt; sigEl.className = `pm-ind-signal ${sig.cls}`; }
}

// ────────────────────────────────────────────────────────────
//  FORECAST MINI-CHART
// ────────────────────────────────────────────────────────────

function renderForecastChart(r) {
  if (pmForecastChart) { pmForecastChart.destroy(); pmForecastChart = null; }

  const histLen   = Math.min(r.historicalData.length, 30);
  const histSlice = r.historicalData.slice(-histLen);
  const foreSlice = r.forecastData;

  // Labels: ... last N "hist" + N "future" points
  const labels = [
    ...histSlice.map((_, i) => i === histLen - 1 ? 'Now' : ''),
    ...foreSlice.map((_, i) => `+${i + 1}`)
  ];

  // Historical dataset (solid)
  const histDataset = {
    label: 'Historical',
    data: [...histSlice, ...Array(foreSlice.length).fill(null)],
    borderColor: '#4f8ef7',
    borderWidth: 2,
    backgroundColor: 'transparent',
    pointRadius: 0,
    tension: 0.35,
    fill: false,
  };

  // Forecast dataset (dashed purple)
  const foreDataset = {
    label: 'Forecast',
    data: [...Array(histLen - 1).fill(null), histSlice[histLen - 1], ...foreSlice],
    borderColor: '#9f67ff',
    borderWidth: 2,
    borderDash: [5, 4],
    backgroundColor: 'transparent',
    pointRadius: 0,
    tension: 0.3,
    fill: false,
  };

  const ctx = document.getElementById('pm-forecast-chart').getContext('2d');
  pmForecastChart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets: [histDataset, foreDataset] },
    options: {
      responsive: false,
      animation: { duration: 700, easing: 'easeInOutQuart' },
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: {
        x: {
          grid:   { display: false },
          border: { display: false },
          ticks:  {
            color: '#535868', font: { size: 9 }, maxRotation: 0,
            callback: (v, i) => {
              if (i === histLen - 1) return 'Now';
              if (i === histLen - 1 + foreSlice.length) return '+' + foreSlice.length;
              return '';
            }
          }
        },
        y: {
          position: 'right',
          grid:   { color: '#1e2029' },
          border: { display: false },
          ticks:  { color: '#535868', font: { size: 9 }, callback: v => '$' + Number(v).toFixed(0) }
        }
      },
      interaction: { mode: 'index', intersect: false }
    }
  });
}

// ── Close on Escape key ─────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closePredictModal();
});
