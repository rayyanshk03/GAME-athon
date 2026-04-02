import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useData } from '../context/StockDataContext';
import InvestActionPanel from './InvestActionPanel';
import { useCrowd } from '../context/CrowdIntelligenceContext';
import SentimentPanel from './SentimentPanel';
import AIInsightsPanel from './AIInsightsPanel';

function computeRSI(data, period = 14) {
  if (!data || data.length < period + 1) return null;
  const slice = data.slice(-period - 1);
  let gains = 0, losses = 0;
  for (let i = 1; i < slice.length; i++) {
    const d = slice[i].price - slice[i - 1].price;
    if (d > 0) gains += d; else losses -= d;
  }
  const rs  = gains / (losses || 0.001);
  return Math.round(100 - 100 / (1 + rs));
}

function computeMA(data, period = 20) {
  if (!data || data.length < period) return null;
  const slice = data.slice(-period);
  return Math.round((slice.reduce((s, d) => s + d.price, 0) / period) * 100) / 100;
}

export default function StockDashboard() {
  const {
    stocks,
    loading,
    error,
    selectedSymbol,
    setSelectedSymbol,
    history,
    historyLoading,
    historyError,
  } = useData();
  const [indicator, setIndicator] = useState('price');
  const { getHybridScore } = useCrowd();

  if (loading && stocks.length === 0) {
    return (
      <div className="dashboard-page" style={{ padding: '20px' }}>
        <div className="skeleton-line" style={{ width: '100%', height: '40px', marginBottom: '20px', borderRadius: '4px' }}></div>
        <div className="dashboard-grid">
          <div className="skeleton-box" style={{ width: '100%', height: '350px', borderRadius: '8px' }}></div>
          <div className="skeleton-box" style={{ width: '100%', height: '350px', borderRadius: '8px' }}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="error-card">⚠️ Error loading live data: {error}</div>;
  }

  const stock = stocks.find(s => s.symbol === selectedSymbol) || stocks[0];
  if (!stock) return null;

  const rsi     = computeRSI(history);
  const ma20    = computeMA(history, 20);
  const ma50    = computeMA(history, 50);
  const trend   = ma20 != null && ma50 != null ? (ma20 > ma50 ? 'Uptrend' : 'Downtrend') : null;
  const score   = getHybridScore(selectedSymbol || stock.symbol);

  const chartData = history.slice(-48).map(h => ({
    time: h.dateLabel,
    price: h.price,
    volume: h.volume,
  }));

  return (
    <div className="dashboard-page" id="stock-dashboard">
      {/* Stock bar */}
      <div className="stock-ticker">
        {stocks.map(s => (
          <button key={s.symbol} id={`ticker-${s.symbol}`}
            className={`ticker-item ${selectedSymbol === s.symbol ? 'active' : ''}`}
            onClick={() => setSelectedSymbol(s.symbol)}>
            <span className="ticker-sym">{s.symbol}</span>
            <span className="ticker-price">${Number(s.price).toFixed(2)}</span>
            <span className={`ticker-chg ${Number(s.changePercent) >= 0 ? 'up' : 'down'}`}>
              {Number(s.changePercent) >= 0 ? '▲' : '▼'}{Math.abs(Number(s.changePercent)).toFixed(2)}%
            </span>
          </button>
        ))}
      </div>

      <div className="dashboard-grid">
        {/* Chart */}
        <div className="panel chart-main-panel">
          <div className="chart-header">
            <div>
              <h2 className="stock-name">{stock.name} <span className="stock-symbol">({stock.symbol})</span></h2>
              <div className="stock-price-display">
                <span className="big-price">${stock.price}</span>
                <span className={`price-change ${stock.changePercent >= 0 ? 'up' : 'down'}`}>
                  {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent}%
                </span>
              </div>
            </div>
            <div className="indicator-tabs">
              {['price', 'volume'].map(ind => (
                <button key={ind} id={`ind-${ind}`} className={`filter-btn ${indicator === ind ? 'active' : ''}`}
                  onClick={() => setIndicator(ind)}>{ind}</button>
              ))}
            </div>
          </div>

          <div style={{ position: 'relative', minHeight: 240 }}>
            {historyLoading && chartData.length === 0 && (
              <div
                className="chart-loading-overlay"
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(15, 23, 42, 0.55)',
                  borderRadius: 8,
                  fontSize: 13,
                  color: 'var(--muted)',
                }}
              >
                Loading chart…
              </div>
            )}
            {historyError && chartData.length === 0 && !historyLoading && (
              <div className="form-error" style={{ padding: '8px 0' }}>{historyError}</div>
            )}
            <ResponsiveContainer width="100%" height={240}>
              {indicator === 'price' ? (
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={stock.changePercent >= 0 ? '#10b981' : '#f43f5e'} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={stock.changePercent >= 0 ? '#10b981' : '#f43f5e'} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--muted)' }} interval={7} />
                  <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: 'var(--muted)' }} />
                  <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 8 }}
                    formatter={v => [`$${v}`, 'Price']} />
                  <Area type="monotone" dataKey="price" stroke={stock.changePercent >= 0 ? '#10b981' : '#f43f5e'}
                    fill="url(#priceGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              ) : (
                <BarChart data={chartData}>
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--muted)' }} interval={7} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--muted)' }} />
                  <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 8 }}
                    formatter={v => [v.toLocaleString(), 'Volume']} />
                  <Bar dataKey="volume" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Indicators row */}
          <div className="indicators-row">
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

        {/* Invest panel */}
        <InvestActionPanel rsi={rsi} trend={trend} />
      </div>

      {/* Module C - Core UI bottom row */}
      <div className="two-col" style={{ marginTop: '1.5rem' }}>
        <SentimentPanel symbol={selectedSymbol} />
        <AIInsightsPanel />
      </div>

    </div>
  );
}
