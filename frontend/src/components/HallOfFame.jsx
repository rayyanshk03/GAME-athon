import { usePortfolio } from '../context/PortfolioContext';
import { useGamification } from '../context/GamificationContext';

const HALL = [
  { id: 'ten_streak',  name: '10-Win Streak',    icon: '⚡', desc: 'Win 10 trades in a row.',      rarity: 'legendary' },
  { id: 'millionaire', name: 'Point Millionaire', icon: '💎', desc: 'Accumulate 1M lifetime points.', rarity: 'legendary' },
  { id: 'streak_king', name: 'Streak King',       icon: '🔥', desc: '7-day login streak.',           rarity: 'epic'  },
  { id: 'point_hunter',name: 'Point Hunter',      icon: '👑', desc: 'Reach 2,000 points.',           rarity: 'epic'  },
  { id: 'market_guru', name: 'Market Guru',       icon: '🧙', desc: 'Win 10 total trades.',          rarity: 'rare'  },
  { id: 'risk_master', name: 'Risk Master',       icon: '🎯', desc: 'Win 3 bets at 3x multiplier.',  rarity: 'rare'  },
];

export default function HallOfFame() {
  const { badges } = useGamification();
  const { winRate, totalPnL, tradeHistory } = usePortfolio();
  const earnedIds = badges.map(b => b.id);

  return (
    <div className="panel hall-panel" id="hall-of-fame">
      <h2 className="panel-title">🏅 Hall of Fame — Ultra-Rare Achievements</h2>

      <div className="hof-stats-row">
        <div className="hof-stat"><span className="hof-stat-val">{tradeHistory.length}</span><span>Total Trades</span></div>
        <div className="hof-stat"><span className="hof-stat-val">{winRate}%</span><span>Win Rate</span></div>
        <div className="hof-stat"><span className="hof-stat-val">{totalPnL >= 0 ? '+' : ''}{totalPnL}</span><span>Total P&L</span></div>
        <div className="hof-stat"><span className="hof-stat-val">{badges.length}</span><span>Badges</span></div>
      </div>

      <div className="hof-grid">
        {HALL.map(h => {
          const earned = earnedIds.includes(h.id);
          return (
            <div key={h.id} className={`hof-card ${earned ? 'earned' : 'locked'} rarity-${h.rarity}`}>
              <div className="hof-icon">{earned ? h.icon : '🔒'}</div>
              <div className="hof-name">{h.name}</div>
              <div className="hof-rarity">{h.rarity.toUpperCase()}</div>
              <div className="hof-desc">{h.desc}</div>
              {earned && <div className="hof-earned-tag">✅ Achieved</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
