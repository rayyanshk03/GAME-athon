import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { STOCKS, SENTIMENT_DATA, generateHistoricalData } from '../data/mockData';
import InvestActionPanel from './InvestActionPanel';
import { useCrowd } from '../context/CrowdIntelligenceContext';

const CHART_CACHE = {};
function getHistory(symbol) {
  if (!CHART_CACHE[symbol]) {
    const stock = STOCKS.find(s => s.symbol === symbol);
    CHART_CACHE[symbol] = generateHistoricalData(stock?.price || 100);
  }
  return CHART_CACHE[symbol];
}

function computeRSI(data, period = 14) {
  if (data.length < period + 1) return null;
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
  if (data.length < period) return null;
  const slice = data.slice(-period);
  return Math.round((slice.reduce((s, d) => s + d.price, 0) / period) * 100) / 100;
}

export default function StockDashboard() {
  const [selected, setSelected] = useState(STOCKS[0].symbol);
  const [indicator, setIndicator] = useState('price');
  const { getHybridScore } = useCrowd();

  const stock   = STOCKS.find(s => s.symbol === selected);
  const history = getHistory(selected);
  const rsi     = computeRSI(history);
  const ma20    = computeMA(history, 20);
  const score   = getHybridScore(selected);

  const chartData = history.slice(-48).map(h => ({
    time: new Date(h.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    price: h.price,
    volume: h.volume,
  }));

  return (
    <div className="dashboard-page" id="stock-dashboard">
      {/* Stock bar */}
      <div className="stock-ticker">
        {STOCKS.map(s => (
          <button key={s.symbol} id={`ticker-${s.symbol}`}
            className={`ticker-item ${selected === s.symbol ? 'active' : ''}`}
            onClick={() => setSelected(s.symbol)}>
            <span className="ticker-sym">{s.symbol}</span>
            <span className="ticker-price">${s.price}</span>
            <span className={`ticker-chg ${s.changePercent >= 0 ? 'up' : 'down'}`}>
              {s.changePercent >= 0 ? '▲' : '▼'}{Math.abs(s.changePercent)}%
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

          {/* Indicators row */}
          <div className="indicators-row">
            <div className={`indicator-pill rsi-pill ${rsi > 70 ? 'overbought' : rsi < 30 ? 'oversold' : 'neutral'}`}>
              RSI {rsi} {rsi > 70 ? '⚠️ Overbought' : rsi < 30 ? '🟢 Oversold' : '⚖️ Neutral'}
            </div>
            <div className="indicator-pill">MA20 ${ma20}</div>
            <div className="indicator-pill">Vol {stock.volume}</div>
            <div className={`indicator-pill hybrid-pill ${score.direction}`}>
              Crowd+AI: {score.direction} ({score.score}/100)
            </div>
          </div>
        </div>

        {/* Invest panel */}
        <InvestActionPanel />
      </div>
    </div>
  );
}
