import { useGamification } from '../context/GamificationContext';
import { BADGES } from '../utils/engines/RewardsEngine';

const RARITY_COLOR = { common: '#64748b', uncommon: '#22c55e', rare: '#3b82f6', epic: '#a855f7', legendary: '#f59e0b' };

export default function RewardsDashboard() {
  const { badges, loginStreak, dailyQuests, claimQuest, points } = useGamification();
  const earnedIds = badges.map(b => b.id);
  const allBadges = Object.values(BADGES);

  return (
    <div className="rewards-page" id="rewards-page">
      {/* Streak */}
      <div className="panel streak-panel">
        <h2 className="panel-title">🔥 Login Streak</h2>
        <div className="streak-display">
          <span className="streak-number">{loginStreak}</span>
          <span className="streak-unit">days</span>
        </div>
        <div className="streak-dots">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className={`streak-dot ${i < loginStreak % 7 ? 'filled' : ''}`} />
          ))}
        </div>
        <p className="streak-hint">
          {loginStreak >= 7 ? '🎉 7-day bonus active! +25 pts/day' :
           loginStreak >= 1 ? `${7 - (loginStreak % 7)} more days for streak bonus!` : 'Log in daily to build your streak!'}
        </p>
      </div>

      {/* Daily quests */}
      <div className="panel quests-panel">
        <h2 className="panel-title">🎯 Daily Quests</h2>
        <div className="quests-list">
          {dailyQuests.map(q => (
            <div key={q.id} className={`quest-card ${q.completed ? 'completed' : ''}`}>
              <div className="quest-info">
                <span className="quest-title">{q.title}</span>
                <span className="quest-reward">+{q.reward} pts</span>
              </div>
              <div className="quest-progress-bar">
                <div className="quest-fill" style={{ width: `${(q.progress / q.target) * 100}%` }} />
              </div>
              <span className="quest-count">{q.progress}/{q.target}</span>
              {q.completed && !q.rewardClaimed && (
                <button id={`claim-${q.id}`} className="btn-claim" onClick={() => claimQuest(q.id)}>Claim!</button>
              )}
              {q.rewardClaimed && <span className="claimed-tag">✅ Claimed</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      <div className="panel badges-panel">
        <h2 className="panel-title">🎖️ Badge Collection</h2>
        <div className="badges-grid">
          {allBadges.map(b => {
            const earned = earnedIds.includes(b.id);
            return (
              <div key={b.id} className={`badge-card ${earned ? 'earned' : 'locked'}`}
                style={{ '--rarity-color': RARITY_COLOR[b.rarity] }}>
                <div className="badge-icon">{earned ? b.icon : '🔒'}</div>
                <div className="badge-name">{b.name}</div>
                <div className="badge-rarity" style={{ color: RARITY_COLOR[b.rarity] }}>{b.rarity}</div>
                <div className="badge-desc">{b.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
