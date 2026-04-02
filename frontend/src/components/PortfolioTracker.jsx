import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { usePortfolio } from '../context/PortfolioContext';
import { MOCK_LEADERBOARD } from '../api/staticData';
import { useGamification } from '../context/GamificationContext';

export default function PortfolioTracker() {
  const { tradeHistory, pendingBets, totalPnL, winRate, bestTrade, worstTrade, pnlHistory, reputationScore } = usePortfolio();
  const { points } = useGamification();
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? tradeHistory
    : filter === 'won' ? tradeHistory.filter(t => t.won)
    : tradeHistory.filter(t => !t.won);

  const chartData = pnlHistory.map((p, i) => ({ i, pnl: p.cumPnL }));

  return (
    <div className="portfolio-page" id="portfolio-page">
      {/* Summary cards */}
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-val" style={{ color: totalPnL >= 0 ? 'var(--success)' : 'var(--danger)' }}>{totalPnL >= 0 ? '+' : ''}{totalPnL}</div><div className="stat-label">Total P&L (pts)</div></div>
        <div className="stat-card"><div className="stat-val">{winRate}%</div><div className="stat-label">Win Rate</div></div>
        <div className="stat-card"><div className="stat-val">{tradeHistory.length}</div><div className="stat-label">Trades</div></div>
        <div className="stat-card"><div className="stat-val">{reputationScore}</div><div className="stat-label">Rep Score</div></div>
        <div className="stat-card"><div className="stat-val">{points.toLocaleString()}</div><div className="stat-label">Current Points</div></div>
      </div>

      {/* P&L chart */}
      {chartData.length > 1 && (
        <div className="panel chart-panel">
          <h3 className="panel-title">📈 Cumulative P&L</h3>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="i" hide />
              <YAxis hide />
              <Tooltip formatter={v => [`${v} pts`, 'P&L']} contentStyle={{ background: 'var(--surface)', border: 'none', color: 'var(--text)' }} />
              <Area type="monotone" dataKey="pnl" stroke="#10b981" fill="url(#pnlGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Best / worst */}
      {(bestTrade || worstTrade) && (
        <div className="bw-row">
          {bestTrade  && <div className="panel bw-card best">  <div className="bw-label">🏆 Best Trade</div>  <div className="bw-symbol">{bestTrade.symbol}</div>  <div className="bw-val">+{bestTrade.pointDelta} pts</div></div>}
          {worstTrade && <div className="panel bw-card worst"> <div className="bw-label">💔 Worst Trade</div> <div className="bw-symbol">{worstTrade.symbol}</div> <div className="bw-val">{worstTrade.pointDelta} pts</div></div>}
        </div>
      )}

      {/* Open / pending (placed, not yet resolved on portfolio) */}
      {pendingBets.length > 0 && (
        <div className="panel">
          <h3 className="panel-title">Open bets (recorded)</h3>
          <p className="panel-desc" style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>
            These match your active tickets on the Dashboard until you resolve them.
          </p>
          <table className="trade-table">
            <thead>
              <tr>
                <th>Stock</th>
                <th>Direction</th>
                <th>Stake</th>
                <th>Mul</th>
                <th>Duration</th>
                <th>Entry</th>
                <th>Placed</th>
              </tr>
            </thead>
            <tbody>
              {pendingBets.map((b) => (
                <tr key={b.id}>
                  <td><strong>{b.symbol}</strong></td>
                  <td>{b.direction === 'up' ? '📈 Up' : '📉 Down'}</td>
                  <td>{b.stake} pts</td>
                  <td>{b.multiplier}x</td>
                  <td>{b.duration}</td>
                  <td>${Number(b.entryPrice).toFixed(2)}</td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{new Date(b.placedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Trade history */}
      <div className="panel">
        <div className="table-header">
          <h3 className="panel-title">Settled trades</h3>
          <div className="filter-row">
            {['all', 'won', 'lost'].map(f => (
              <button key={f} id={`filter-${f}`} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>
        </div>
        {filtered.length === 0 ? (
          <p className="empty-state">No trades yet. Head to Dashboard to place your first bet!</p>
        ) : (
          <table className="trade-table">
            <thead><tr><th>Stock</th><th>Direction</th><th>Stake</th><th>Mul</th><th>P&L</th><th>Result</th></tr></thead>
            <tbody>
              {filtered.slice(0, 20).map((t) => (
                <tr key={t.id ?? `${t.symbol}-${t.resolvedAt}`}>
                  <td><strong>{t.symbol}</strong></td>
                  <td>{t.direction === 'up' ? '📈 Up' : '📉 Down'}</td>
                  <td>{t.stake} pts</td>
                  <td>{t.multiplier}x</td>
                  <td style={{ color: t.pointDelta >= 0 ? 'var(--success)' : 'var(--danger)' }}>{t.pointDelta >= 0 ? '+' : ''}{t.pointDelta}</td>
                  <td>{t.won ? '✅' : '❌'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
