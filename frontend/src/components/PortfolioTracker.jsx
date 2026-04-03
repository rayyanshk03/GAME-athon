import { usePortfolio } from '../context/PortfolioContext';
import { useGamification } from '../context/GamificationContext';
import { useData } from '../context/StockDataContext';
import { calculateOutcome } from '../utils/engines/OutcomeEngine';

// ── Pure-SVG sparkline (no Recharts needed) ───────────────────────────
function Sparkline({ data, color = '#10b981' }) {
  if (!data || data.length < 2) return null;
  const vals   = data.map(d => d.cumPnL);
  const min    = Math.min(...vals);
  const max    = Math.max(...vals);
  const range  = (max - min) || 1;
  const W = 260, H = 60, pad = 4;
  const pts = vals.map((v, i) => {
    const x = pad + (i / (vals.length - 1)) * (W - pad * 2);
    const y = H - pad - ((v - min) / range) * (H - pad * 2);
    return `${x},${y}`;
  }).join(' ');
  const fill = `${pts} ${W - pad},${H - pad} ${pad},${H - pad}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 60 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="splGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={fill} fill="url(#splGrad)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

// ── Tiny badge ─────────────────────────────────────────────────────────
function Badge({ val }) {
  const pos = val >= 0;
  return (
    <span style={{
      fontWeight: 700, fontSize: '0.82rem',
      color: pos ? '#10B981' : '#EF4444',
    }}>
      {pos ? '+' : ''}{val}
    </span>
  );
}

export default function PortfolioTracker() {
  const {
    tradeHistory, pendingBets, totalPnL, winRate,
    bestTrade, worstTrade, pnlHistory, reputationScore, resolvePendingBet,
  } = usePortfolio();
  const { points, resolveBet } = useGamification();
  const { stocks }             = useData();

  // Resolve a pending bet using current market price
  function handleResolve(bet) {
    const stock   = stocks.find(s => s.symbol === bet.symbol);
    const current = stock?.price ?? bet.entryPrice;
    const move    = current * (Math.random() * 0.08 - 0.04); // small sim wiggle
    const exit    = +((current + move).toFixed(2));
    const { pointDelta, won } = calculateOutcome(bet.entryPrice, exit, bet.stake, bet.multiplier, bet.direction);
    resolveBet({ betId: bet.id, pointDelta, won, symbol: bet.symbol, multiplier: bet.multiplier, exitPrice: exit });
    resolvePendingBet({ betId: bet.id, pointDelta, won, exitPrice: exit });
  }

  // Unrealized P&L for open bets
  function unrealizedPnL(bet) {
    const stock   = stocks.find(s => s.symbol === bet.symbol);
    const current = stock?.price ?? bet.entryPrice;
    const pctMove = (current - bet.entryPrice) / bet.entryPrice;
    const dir     = bet.direction === 'up' ? 1 : -1;
    const est     = Math.round(bet.stake * bet.multiplier * pctMove * dir);
    return { est, current, pctMove: (pctMove * 100).toFixed(2) };
  }

  const totalUnrealized = pendingBets.reduce((s, b) => s + unrealizedPnL(b).est, 0);
  const chartColor      = (totalPnL + totalUnrealized) >= 0 ? '#10B981' : '#EF4444';

  return (
    <div className="portfolio-page" id="portfolio-page">

      {/* ── Summary cards ─────────────────────────────────────────── */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-val" style={{ color: totalPnL >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            {totalPnL >= 0 ? '+' : ''}{totalPnL}
          </div>
          <div className="stat-label">Settled P&L (pts)</div>
        </div>
        <div className="stat-card">
          <div className="stat-val" style={{ color: totalUnrealized >= 0 ? 'var(--success)' : 'var(--danger)', fontSize: '1.3rem' }}>
            {totalUnrealized >= 0 ? '+' : ''}{totalUnrealized}
          </div>
          <div className="stat-label">Unrealised P&L</div>
        </div>
        <div className="stat-card">
          <div className="stat-val">{winRate}%</div>
          <div className="stat-label">Win Rate</div>
        </div>
        <div className="stat-card">
          <div className="stat-val">{tradeHistory.length}</div>
          <div className="stat-label">Settled Trades</div>
        </div>
        <div className="stat-card">
          <div className="stat-val">{points.toLocaleString()}</div>
          <div className="stat-label">Current Points</div>
        </div>
      </div>

      {/* ── P&L Sparkline ─────────────────────────────────────────── */}
      {pnlHistory.length > 1 && (
        <div className="panel chart-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 className="panel-title" style={{ margin: 0 }}>📈 Cumulative P&L</h3>
            <span style={{ fontSize: '0.78rem', color: chartColor, fontWeight: 700 }}>
              {totalPnL >= 0 ? '+' : ''}{totalPnL} pts
            </span>
          </div>
          <Sparkline data={pnlHistory} color={chartColor} />
        </div>
      )}

      {/* ── Best / Worst ──────────────────────────────────────────── */}
      {(bestTrade || worstTrade) && (
        <div className="bw-row">
          {bestTrade  && <div className="panel bw-card best">  <div className="bw-label">🏆 Best Trade</div>  <div className="bw-symbol">{bestTrade.symbol}</div>  <div className="bw-val">+{bestTrade.pointDelta} pts</div></div>}
          {worstTrade && <div className="panel bw-card worst"> <div className="bw-label">💔 Worst Trade</div> <div className="bw-symbol">{worstTrade.symbol}</div> <div className="bw-val">{worstTrade.pointDelta} pts</div></div>}
        </div>
      )}

      {/* ── Open Bets with live P&L + Resolve button ─────────────── */}
      {pendingBets.length > 0 && (
        <div className="panel">
          <h3 className="panel-title">📂 Open Positions</h3>
          <p className="panel-desc" style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>
            Live unrealised P&L updates as prices move. Click <strong>Resolve</strong> to settle a bet at the current simulated price.
          </p>
          <table className="trade-table">
            <thead>
              <tr>
                <th>Stock</th>
                <th>Dir</th>
                <th>Stake</th>
                <th>Mul</th>
                <th>Entry</th>
                <th>Current</th>
                <th>Unrealised</th>
                <th>Placed</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingBets.map(b => {
                const { est, current, pctMove } = unrealizedPnL(b);
                return (
                  <tr key={b.id}>
                    <td><strong>{b.symbol}</strong></td>
                    <td>{b.direction === 'up' ? '📈 Up' : '📉 Down'}</td>
                    <td>{b.stake} pts</td>
                    <td>{b.multiplier}x</td>
                    <td>${Number(b.entryPrice).toFixed(2)}</td>
                    <td>${Number(current).toFixed(2)} <span style={{ fontSize: '0.7rem', color: Number(pctMove) >= 0 ? '#10B981' : '#EF4444' }}>({Number(pctMove) >= 0 ? '+' : ''}{pctMove}%)</span></td>
                    <td><Badge val={est} /></td>
                    <td style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{new Date(b.placedAt).toLocaleString()}</td>
                    <td>
                      <button
                        type="button"
                        className="btn-resolve"
                        style={{ fontSize: '0.72rem', padding: '3px 10px', whiteSpace: 'nowrap' }}
                        onClick={() => handleResolve(b)}
                      >
                        Resolve
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Settled Trade History ─────────────────────────────────── */}
      <div className="panel">
        <div className="table-header">
          <h3 className="panel-title">🗂️ Settled Trades</h3>
          {tradeHistory.length > 0 && (
            <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
              {tradeHistory.filter(t => t.won).length}W / {tradeHistory.filter(t => !t.won).length}L
            </span>
          )}
        </div>
        {tradeHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>🎯</div>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>No settled trades yet.</p>
            <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: 4 }}>
              {pendingBets.length > 0
                ? 'Click "Resolve" on your open positions above to settle them.'
                : 'Head to Dashboard → Place Your Bet to get started!'}
            </p>
          </div>
        ) : (
          <table className="trade-table">
            <thead>
              <tr>
                <th>Stock</th>
                <th>Direction</th>
                <th>Stake</th>
                <th>Mul</th>
                <th>Entry</th>
                <th>Exit</th>
                <th>P&L</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {tradeHistory.slice(0, 20).map(t => (
                <tr key={t.id ?? `${t.symbol}-${t.resolvedAt}`}>
                  <td><strong>{t.symbol}</strong></td>
                  <td>{t.direction === 'up' ? '📈 Up' : '📉 Down'}</td>
                  <td>{t.stake} pts</td>
                  <td>{t.multiplier}x</td>
                  <td>${Number(t.entryPrice).toFixed(2)}</td>
                  <td>${Number(t.exitPrice ?? 0).toFixed(2)}</td>
                  <td style={{ color: t.pointDelta >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                    {t.pointDelta >= 0 ? '+' : ''}{t.pointDelta}
                  </td>
                  <td>{t.won ? '✅ Won' : '❌ Lost'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
