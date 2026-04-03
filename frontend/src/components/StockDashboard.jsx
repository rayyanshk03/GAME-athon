import { useData } from '../context/StockDataContext';
import InvestActionPanel from './InvestActionPanel';
import { useCrowd } from '../context/CrowdIntelligenceContext';
import SentimentPanel from './SentimentPanel';
import AIInsightsPanel from './AIInsightsPanel';
import TradingViewChart from './TradingViewChart';

function computeRSI(data, period = 14) {
  if (!data || data.length < period + 1) return null;
  const slice = data.slice(-period - 1);
  let gains = 0, losses = 0;
  for (let i = 1; i < slice.length; i++) {
    const d = slice[i].price - slice[i - 1].price;
    if (d > 0) gains += d; else losses -= d;
  }
  const rs = gains / (losses || 0.001);
  return Math.round(100 - 100 / (1 + rs));
}

function computeMA(data, period = 20) {
  if (!data || data.length < period) return null;
  const slice = data.slice(-period);
  return Math.round((slice.reduce((s, d) => s + d.price, 0) / period) * 100) / 100;
}

// Map backend symbol → TradingView NSE symbol
// Backend symbols from Yahoo Finance look like RELIANCE.NS, TCS.NS etc.
// TradingView expects NSE:RELIANCE, NSE:TCS etc.
function toTVSymbol(sym) {
  if (!sym) return 'NSE:RELIANCE';
  if (sym.includes(':')) return sym; // already a full TV symbol (e.g. from navbar search)
  // Strip common Yahoo Finance exchange suffixes
  const clean = sym.replace(/\.(NS|BO|BSE|L|AX|TO|HK|SI|KS)$/i, '');
  return `NSE:${clean}`;
}

export default function StockDashboard({ tvSymbol, onTvSymbolChange }) {
  const {
    stocks,
    loading,
    error,
    selectedSymbol,
    setSelectedSymbol,
    history,
  } = useData();
  const { getHybridScore } = useCrowd();

  if (loading && stocks.length === 0) {
    return (
      <div className="dashboard-page" style={{ padding: '20px' }}>
        <div className="skeleton-line" style={{ width: '100%', height: '40px', marginBottom: '20px', borderRadius: '4px' }}></div>
        <div className="dashboard-grid">
          <div className="skeleton-box" style={{ width: '100%', height: '500px', borderRadius: '8px' }}></div>
          <div className="skeleton-box" style={{ width: '100%', height: '500px', borderRadius: '8px' }}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="error-card">⚠️ Error loading live data: {error}</div>;
  }

  const stock = stocks.find(s => s.symbol === selectedSymbol) || stocks[0];
  if (!stock) return null;

  const rsi   = computeRSI(history);
  const ma20  = computeMA(history, 20);
  const ma50  = computeMA(history, 50);
  const trend = ma20 != null && ma50 != null ? (ma20 > ma50 ? 'Uptrend' : 'Downtrend') : null;
  const score = getHybridScore(selectedSymbol || stock.symbol);

  // Derive the TV symbol: prefer the prop from navbar search, fall back to selected ticker
  const activeTVSymbol = tvSymbol || toTVSymbol(stock.symbol);

  function handleTickerClick(sym) {
    setSelectedSymbol(sym);
    const tv = toTVSymbol(sym);
    onTvSymbolChange?.(tv);
  }

  return (
    <div className="dashboard-page" id="stock-dashboard">

      {/* ── Stock ticker bar ── */}
      <div className="stock-ticker">
        {stocks.map(s => (
          <button
            key={s.symbol}
            id={`ticker-${s.symbol}`}
            className={`ticker-item ${selectedSymbol === s.symbol ? 'active' : ''}`}
            onClick={() => handleTickerClick(s.symbol)}
          >
            <span className="ticker-sym">{s.symbol}</span>
            <span className="ticker-price">${Number(s.price).toFixed(2)}</span>
            <span className={`ticker-chg ${Number(s.changePercent) >= 0 ? 'up' : 'down'}`}>
              {Number(s.changePercent) >= 0 ? '▲' : '▼'}{Math.abs(Number(s.changePercent)).toFixed(2)}%
            </span>
          </button>
        ))}
      </div>

      <div className="dashboard-grid">

        {/* ── Chart panel ── */}
        <div className="panel chart-main-panel">

          {/* Stock name + price header */}
          <div className="chart-header">
            <div>
              <h2 className="stock-name">
                {stock.name} <span className="stock-symbol">({stock.symbol})</span>
              </h2>
              <div className="stock-price-display">
                <span className="big-price">${Number(stock.price).toFixed(2)}</span>
                <span className={`price-change ${Number(stock.changePercent) >= 0 ? 'up' : 'down'}`}>
                  {Number(stock.changePercent) >= 0 ? '+' : ''}{Number(stock.changePercent).toFixed(2)}%
                </span>
              </div>
            </div>
            <span className="tv-chart-badge" style={{ alignSelf: 'flex-start' }}>
              TradingView · Live
            </span>
          </div>

          {/* ── TradingView Full Widget (one chart at a time) ── */}
          <div style={{ marginTop: '0.75rem' }}>
            <TradingViewChart
              key={activeTVSymbol}
              symbol={activeTVSymbol}
              theme="dark"
              height={490}
            />
          </div>

          {/* ── Indicator pills ── */}
          <div className="indicators-row" style={{ marginTop: '0.75rem' }}>
            <div className={`indicator-pill rsi-pill ${rsi == null ? 'neutral' : rsi > 70 ? 'overbought' : rsi < 30 ? 'oversold' : 'neutral'}`}>
              RSI {rsi ?? '—'} {rsi == null ? '' : rsi > 70 ? '⚠️ Overbought' : rsi < 30 ? '🟢 Oversold' : '⚖️ Neutral'}
            </div>
            <div className="indicator-pill">MA20 ${ma20 ?? '—'}</div>
            <div className="indicator-pill">MA50 ${ma50 ?? 'N/A'}</div>
            {trend == null ? (
              <div className="indicator-pill">Trend: —</div>
            ) : (
              <div className={`indicator-pill hybrid-pill ${trend === 'Uptrend' ? 'bullish' : 'bearish'}`}>
                Trend: {trend === 'Uptrend' ? '📈' : '📉'} {trend}
              </div>
            )}
            <div className="indicator-pill">Vol {stock.volume}</div>
            <div className={`indicator-pill hybrid-pill ${score.direction}`}>
              Crowd+AI: {score.direction} ({score.score}/100)
            </div>
          </div>
        </div>

        {/* ── Invest panel (unchanged) ── */}
        <InvestActionPanel rsi={rsi} trend={trend} />
      </div>

      {/* ── Bottom row: Sentiment + AI Insights (unchanged) ── */}
      <div className="two-col" style={{ marginTop: '1.5rem' }}>
        <SentimentPanel symbol={selectedSymbol} />
        <AIInsightsPanel />
      </div>

    </div>
  );
}
