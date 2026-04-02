import { useState } from 'react';
import { useGamification } from '../context/GamificationContext';
import { usePortfolio } from '../context/PortfolioContext';
import { useCrowd } from '../context/CrowdIntelligenceContext';
import { calculateOutcome, rollDoubleOrNothing } from '../engine/OutcomeEngine';
import { STOCKS } from '../data/mockData';

export default function InvestActionPanel() {
  const { points, activeBets, placeBet, resolveBet, riskProfile, setRiskProfile, getMaxStakeVal, validate } = useGamification();
  const { addTrade } = usePortfolio();
  const { simMode } = useCrowd();

  const [selected, setSelected]   = useState(STOCKS[0]);
  const [stake, setStake]         = useState('');
  const [direction, setDirection] = useState('up');
  const [multiplier, setMultiplier] = useState(1);
  const [duration, setDuration]   = useState('1h');
  const [error, setError]         = useState('');
  const [dnMode, setDnMode]       = useState(null); // double-or-nothing bet

  const maxMul = simMode === 'beginner' ? 1 : 3;

  function handlePlace() {
    const v = validate(Number(stake));
    if (!v.valid) { setError(v.error); return; }
    setError('');
    placeBet({ symbol: selected.symbol, sector: selected.sector, stake: Number(stake), direction, multiplier, duration, entryPrice: selected.price });
    setStake('');
  }

  function handleSimResolve(bet) {
    // Simulate a random price move (±5%) for demo
    const move  = selected.price * (Math.random() * 0.1 - 0.05);
    const exit  = Math.round((selected.price + move) * 100) / 100;
    const { pointDelta, won } = calculateOutcome(bet.entryPrice, exit, bet.stake, bet.multiplier, bet.direction);
    resolveBet({ betId: bet.id, pointDelta, won, symbol: bet.symbol, multiplier: bet.multiplier, exitPrice: exit });
    addTrade({ ...bet, pointDelta, won, exitPrice: exit, resolvedAt: Date.now() });
    if (won) setDnMode({ bet, pointDelta });
  }

  function handleDoubleOrNothing() {
    if (!dnMode) return;
    const mul = rollDoubleOrNothing();
    const final = mul === 2 ? dnMode.pointDelta * 2 : -dnMode.bet.stake;
    resolveBet({ betId: dnMode.bet.id, pointDelta: final - dnMode.pointDelta, won: mul === 2, symbol: dnMode.bet.symbol, multiplier: 1, exitPrice: 0 });
    setDnMode(null);
  }

  return (
    <div className="panel invest-panel" id="invest-action-panel">
      <h2 className="panel-title">💰 Place Your Bet</h2>

      {/* Stock selector */}
      <div className="form-group">
        <label>Stock</label>
        <select id="stock-selector" value={selected.symbol} onChange={e => setSelected(STOCKS.find(s => s.symbol === e.target.value))}>
          {STOCKS.map(s => <option key={s.symbol} value={s.symbol}>{s.symbol} — ${s.price} ({s.changePercent > 0 ? '+' : ''}{s.changePercent}%)</option>)}
        </select>
      </div>

      {/* Direction */}
      <div className="form-group direction-row">
        <button id="btn-up"   className={`dir-btn up   ${direction === 'up'   ? 'active' : ''}`} onClick={() => setDirection('up')}>  📈 Up   </button>
        <button id="btn-down" className={`dir-btn down ${direction === 'down' ? 'active' : ''}`} onClick={() => setDirection('down')}>📉 Down</button>
      </div>

      {/* Stake */}
      <div className="form-group">
        <label>Stake (max {getMaxStakeVal()} pts)</label>
        <input id="stake-input" type="number" min="10" max={getMaxStakeVal()} value={stake}
          onChange={e => setStake(e.target.value)} placeholder="Enter points..." />
      </div>

      {/* Multiplier */}
      <div className="form-group">
        <label>Risk Multiplier</label>
        <div className="multiplier-row">
          {[1, 2, 3].map(m => (
            <button key={m} id={`mul-${m}x`}
              className={`mul-btn ${multiplier === m ? 'active' : ''} ${m > maxMul ? 'disabled' : ''}`}
              onClick={() => m <= maxMul && setMultiplier(m)}>{m}x</button>
          ))}
        </div>
      </div>

      {/* Timer */}
      <div className="form-group">
        <label>⏱ Bet Duration</label>
        <div className="duration-row">
          {['15m', '1h', '1d'].map(d => (
            <button key={d} id={`dur-${d}`} className={`dur-btn ${duration === d ? 'active' : ''}`}
              onClick={() => setDuration(d)}>{d}</button>
          ))}
        </div>
      </div>

      {/* Risk profile */}
      <div className="form-group">
        <label>Risk Profile</label>
        <div className="risk-row">
          {['safe', 'balanced', 'aggressive'].map(r => (
            <button key={r} id={`risk-${r}`} className={`risk-btn ${riskProfile === r ? 'active' : ''}`}
              onClick={() => setRiskProfile(r)}>{r}</button>
          ))}
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}
      <button id="place-bet-btn" className="btn-primary" onClick={handlePlace} disabled={!stake || points < 10}>
        Place Bet 🚀
      </button>

      {/* Active bets */}
      {activeBets.length > 0 && (
        <div className="active-bets">
          <h3>Active Bets</h3>
          {activeBets.map(bet => (
            <div key={bet.id} className="bet-card">
              <span className="bet-symbol">{bet.symbol}</span>
              <span className={`bet-dir ${bet.direction}`}>{bet.direction === 'up' ? '📈' : '📉'} {bet.direction}</span>
              <span className="bet-stake">{bet.stake} pts × {bet.multiplier}x</span>
              <span className="bet-dur">{bet.duration}</span>
              <button className="btn-resolve" onClick={() => handleSimResolve(bet)}>Resolve (Demo)</button>
            </div>
          ))}
        </div>
      )}

      {/* Double-or-nothing */}
      {dnMode && (
        <div className="don-modal">
          <div className="don-card">
            <h3>🎰 Double-or-Nothing?</h3>
            <p>You won <strong>+{dnMode.pointDelta} pts</strong>. Risk it all to double?</p>
            <div className="don-actions">
              <button id="don-yes" className="btn-primary" onClick={handleDoubleOrNothing}>🎲 Roll the Dice</button>
              <button id="don-no"  className="btn-ghost"   onClick={() => setDnMode(null)}>Keep My Points</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
