import { useState } from 'react';
import { useGamification } from '../context/GamificationContext';
import { usePortfolio } from '../context/PortfolioContext';
import { MOCK_LEADERBOARD } from '../api/staticData';

export default function Leaderboard() {
  const { points, badges } = useGamification();
  const { winRate, reputationScore } = usePortfolio();
  const [view, setView] = useState('global');

  // Merge current user into leaderboard
  const board = MOCK_LEADERBOARD.map(entry =>
    entry.isCurrentUser ? { ...entry, points, winRate, reputationScore } : entry
  ).sort((a, b) => b.points - a.points).map((e, i) => ({ ...e, rank: i + 1 }));

  return (
    <div className="panel leaderboard-panel" id="leaderboard-panel">
      <div className="panel-header">
        <h2 className="panel-title">🏆 Leaderboard</h2>
        <div className="view-tabs">
          {['global', 'daily', 'weekly'].map(v => (
            <button key={v} id={`lb-${v}`} className={`filter-btn ${view === v ? 'active' : ''}`} onClick={() => setView(v)}>{v}</button>
          ))}
        </div>
      </div>

      {/* Podium */}
      <div className="podium">
        {board.slice(0, 3).map((entry, idx) => (
          <div key={entry.name} className={`podium-slot rank-${idx + 1} ${entry.isCurrentUser ? 'you' : ''}`}>
            <div className="podium-crown">{idx === 0 ? '👑' : idx === 1 ? '🥈' : '🥉'}</div>
            <div className="podium-avatar">{entry.name[0]}</div>
            <div className="podium-name">{entry.isCurrentUser ? 'You' : entry.name}</div>
            <div className="podium-pts">{entry.points.toLocaleString()} pts</div>
          </div>
        ))}
      </div>

      {/* Full table */}
      <table className="trade-table">
        <thead><tr><th>Rank</th><th>Trader</th><th>Points</th><th>Win Rate</th><th>Rep</th><th>Δ</th></tr></thead>
        <tbody>
          {board.map(e => (
            <tr key={e.name} className={e.isCurrentUser ? 'current-user-row' : ''}>
              <td><strong>#{e.rank}</strong></td>
              <td>{e.isCurrentUser ? '⭐ You' : e.name}</td>
              <td>{e.points.toLocaleString()}</td>
              <td>{e.winRate}%</td>
              <td>{e.reputationScore ?? '—'}</td>
              <td style={{ color: e.delta >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {e.delta >= 0 ? '▲' : '▼'}{Math.abs(e.delta)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
