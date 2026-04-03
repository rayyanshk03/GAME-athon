import { useState, useEffect } from 'react';
import { useGamification } from '../context/GamificationContext';
import { usePortfolio } from '../context/PortfolioContext';
import { useCrowd } from '../context/CrowdIntelligenceContext';
import { calculateOutcome, rollDoubleOrNothing } from '../utils/engines/OutcomeEngine';
import { useData } from '../context/StockDataContext';
import { getStockInsight } from '../api/apiClient';

function formatTime(ts) {
  try {
    return new Date(ts).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return '';
  }
}

export default function InvestActionPanel({ rsi, trend }) {
  const { points, activeBets, placeBet, resolveBet, getMaxStakeVal, validate } = useGamification();
  const { addPendingBet, resolvePendingBet } = usePortfolio();
  const { simMode } = useCrowd();
  const { stocks, selectedSymbol, setSelectedSymbol, history } = useData();

  const [stake, setStake] = useState('');
  const [direction, setDirection] = useState('buy');
  const [duration, setDuration] = useState('1h');
  const [error, setError] = useState('');
  const [dnMode, setDnMode] = useState(null);
  const [insight, setInsight] = useState('');
  const [insightLoading, setInsightLoading] = useState(false);

  const currentStock = stocks.find(s => s.symbol === selectedSymbol) || stocks[0];

  useEffect(() => {
    if (!currentStock) return;
    let isMounted = true;
    const fetchInsight = async () => {
      setInsightLoading(true);
      setInsight('');
      try {
        const text = await getStockInsight(currentStock.symbol, {
          price: currentStock.price,
          trend: trend,
          rsi: rsi
        });
        if (isMounted) setInsight(text);
      } catch (err) {
        if (isMounted) setInsight('Failed to load insight.');
      }
      if (isMounted) setInsightLoading(false);
    };
    fetchInsight();
    return () => { isMounted = false; };
  }, [currentStock?.symbol, currentStock?.price, trend, rsi]);

  function handlePlace() {
    const v = validate(Number(stake));
    if (!v.valid) { setError(v.error); return; }
    setError('');
    const betId = Date.now();
    const payload = {
      id: betId,
      placedAt: betId,
      symbol: currentStock.symbol,
      sector: currentStock.sector || 'General',
      stake: Number(stake),
      direction,
      duration,
      entryPrice: currentStock.price,
      rsiAtEntry: rsi,
      trendAtEntry: trend,
    };
    placeBet(payload);
    addPendingBet(payload);
    setStake('');
  }

  function handleSimResolve(bet) {
    const move = currentStock.price * (Math.random() * 0.1 - 0.05);
    const exit = Math.round((currentStock.price + move) * 100) / 100;
    const prevMul = bet.multiplier || 1;
    const { pointDelta, won } = calculateOutcome(bet.entryPrice, exit, bet.stake, prevMul, bet.direction);
    resolveBet({ betId: bet.id, pointDelta, won, symbol: bet.symbol, multiplier: prevMul, exitPrice: exit });
    resolvePendingBet({ betId: bet.id, pointDelta, won, exitPrice: exit });
    if (won) setDnMode({ bet, pointDelta });
  }

  function handleDoubleOrNothing() {
    if (!dnMode) return;
    const mul = rollDoubleOrNothing();
    const final = mul === 2 ? dnMode.pointDelta * 2 : -dnMode.bet.stake;
    resolveBet({ betId: dnMode.bet.id, pointDelta: final - dnMode.pointDelta, won: mul === 2, symbol: dnMode.bet.symbol, multiplier: 1, exitPrice: 0 });
    setDnMode(null);
  }

  const renderCandlestick = () => {
    if (history.length === 0) return <div className="skeleton-box" style={{ height: 120, width: '100%', borderRadius: 8 }} />;

    const subset = history.slice(-20);
    const maxP = Math.max(...subset.map(d => d.high));
    const minP = Math.min(...subset.map(d => d.low));
    const range = (maxP - minP) || 1;

    const svgWidth = 100;
    const svgHeight = 100;
    const barWidth = svgWidth / subset.length;

    return (
      <div style={{ background: 'var(--surface)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '15px' }}>
        <p style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>Volatility View (Candlestick)</p>
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: '100px', overflow: 'visible' }}>
          {subset.map((d, i) => {
            const x = i * barWidth + (barWidth / 2);
            const yHigh = svgHeight - ((d.high - minP) / range * svgHeight);
            const yLow = svgHeight - ((d.low - minP) / range * svgHeight);
            const yOpen = svgHeight - ((d.open - minP) / range * svgHeight);
            const yClose = svgHeight - ((d.price - minP) / range * svgHeight);

            const isBull = d.price >= d.open;
            const yTop = Math.min(yOpen, yClose);
            const yBot = Math.max(yOpen, yClose);
            const color = isBull ? '#10b981' : '#f43f5e';

            return (
              <g key={i}>
                <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={color} strokeWidth="0.5" />
                <rect x={x - (barWidth * 0.35)} y={yTop} width={barWidth * 0.7} height={Math.max(yBot - yTop, 0.5)} fill={color} />
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  if (!stocks || stocks.length === 0) {
    return <div className="panel invest-panel skeleton-box" style={{ height: 400 }}></div>;
  }

  return (
    <div className="panel invest-panel" id="invest-action-panel">
      <h2 className="panel-title">Place Your Bet</h2>

      <div className="form-group">
        <label>Stock</label>
        <select id="stock-selector" value={selectedSymbol || ''} onChange={e => setSelectedSymbol(e.target.value)}>
          {stocks.map(s => <option key={s.symbol} value={s.symbol}>{s.symbol} — ${Number(s.price).toFixed(2)} ({Number(s.changePercent) >= 0 ? '+' : ''}{Number(s.changePercent).toFixed(2)}%)</option>)}
        </select>
      </div>

      {renderCandlestick()}

      <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, padding: '10px', marginBottom: '15px' }}>
        <h4 style={{ margin: '0 0 5px 0', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px', color: '#e2e8f0' }}>
          AI Quick Insight
          {insightLoading && <span className="spinner" style={{ width: 10, height: 10, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />}
        </h4>
        <p style={{ margin: 0, fontSize: '12px', color: '#93c5fd', minHeight: '36px', lineHeight: 1.4 }}>
          {insight || (insightLoading ? 'Loading insight...' : '')}
        </p>
      </div>

      <div className="form-group direction-row">
        <button id="btn-buy" type="button" className={`dir-btn up   ${direction === 'buy' ? 'active' : ''}`} onClick={() => setDirection('buy')}>  📈 Buy   </button>
        <button id="btn-sell" type="button" className={`dir-btn down ${direction === 'sell' ? 'active' : ''}`} onClick={() => setDirection('sell')}>📉 Sell</button>
      </div>

      <div className="form-group">
        <label>Stake (max {getMaxStakeVal()} pts)</label>
        <input id="stake-input" type="number" min="10" max={getMaxStakeVal()} value={stake}
          onChange={e => setStake(e.target.value)} placeholder="Enter points..." />
      </div>


      <div className="form-group">
        <label>Bet duration (tracked on ticket)</label>
        <div className="duration-row">
          {['15m', '1h', '1d'].map(d => (
            <button key={d} type="button" id={`dur-${d}`} className={`dur-btn ${duration === d ? 'active' : ''}`}
              onClick={() => setDuration(d)}>{d}</button>
          ))}
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}
      <button id="place-bet-btn" type="button" className="btn-primary" onClick={handlePlace} disabled={!stake || points < 10}>
        Place Bet 
      </button>

      {activeBets.length > 0 && (
        <div className="active-bets">
          <h3>Active bets</h3>
          {activeBets.map(bet => (
            <div key={bet.id} className="bet-card">
              <div className="bet-card-row"><strong>{bet.symbol}</strong> <span className="muted">{formatTime(bet.placedAt)}</span></div>
              <div className="bet-card-row">
                <span className={`bet-dir ${bet.direction}`}>{bet.direction === 'buy' ? '📈' : '📉'} {bet.direction}</span>
                <span>{bet.stake} pts · {bet.duration}</span>
              </div>
              <div className="bet-card-row muted" style={{ fontSize: 12 }}>Entry ${Number(bet.entryPrice).toFixed(2)} · RSI {bet.rsiAtEntry ?? '—'} · Trend {bet.trendAtEntry ?? '—'}</div>
              <button type="button" className="btn-resolve" onClick={() => handleSimResolve(bet)}>Resolve (demo)</button>
            </div>
          ))}
        </div>
      )}

      {dnMode && (
        <div className="don-modal">
          <div className="don-card">
            <h3>Double-or-Nothing?</h3>
            <p>You won <strong>+{dnMode.pointDelta} pts</strong>. Risk it all to double?</p>
            <div className="don-actions">
              <button id="don-yes" type="button" className="btn-primary" onClick={handleDoubleOrNothing}> Roll the Dice</button>
              <button id="don-no" type="button" className="btn-ghost" onClick={() => setDnMode(null)}>Keep My Points</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
