import { useState, useEffect } from 'react';
import { useCrowd } from '../context/CrowdIntelligenceContext';
import { STOCKS } from '../data/mockData';
import { useGamification } from '../context/GamificationContext';

function formatTime(ms) {
  if (ms <= 0) return '00:00';
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function TimeChallengePanel() {
  const { challenges, addChallenge } = useCrowd();
  const { earnPoints } = useGamification();
  const [ticks, setTicks] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTicks(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  function createChallenge() {
    const stock = STOCKS[Math.floor(Math.random() * STOCKS.length)];
    addChallenge({ symbol: stock.symbol, entryPrice: stock.price, durationMs: 60000, reward: 50 });
  }

  function handlePredict(challenge, direction) {
    const elapsed = Date.now() - challenge.startedAt;
    const remaining = challenge.durationMs - elapsed;
    if (remaining <= 0) return;
    const simMove = challenge.entryPrice * (Math.random() * 0.06 - 0.03);
    const exitPrice = challenge.entryPrice + simMove;
    const won = direction === 'up' ? exitPrice > challenge.entryPrice : exitPrice < challenge.entryPrice;
    if (won) earnPoints(challenge.reward);
    alert(won ? `✅ Correct! +${challenge.reward} pts` : '❌ Wrong direction. No points.');
  }

  return (
    <div className="panel challenge-panel" id="time-challenge-panel">
      <div className="panel-header">
        <h2 className="panel-title">⏱ Time Challenges</h2>
        <button id="new-challenge-btn" className="btn-primary" onClick={createChallenge}>+ New Challenge</button>
      </div>

      {challenges.length === 0 ? (
        <p className="empty-state">No active challenges. Click "+ New Challenge" to start a 1-minute prediction!</p>
      ) : (
        <div className="challenges-list">
          {challenges.slice(0, 5).map(c => {
            const elapsed   = Date.now() - c.startedAt;
            const remaining = Math.max(0, c.durationMs - elapsed);
            const expired   = remaining === 0;
            return (
              <div key={c.id} className={`challenge-card ${expired ? 'expired' : ''}`}>
                <div className="challenge-stock">{c.symbol}</div>
                <div className="challenge-price">${c.entryPrice}</div>
                <div className={`challenge-timer ${remaining < 15000 ? 'urgent' : ''}`}>
                  {expired ? '⌛ Expired' : `⏱ ${formatTime(remaining)}`}
                </div>
                <div className="challenge-reward">+{c.reward} pts</div>
                {!expired && (
                  <div className="challenge-btns">
                    <button id={`pred-up-${c.id}`}   className="dir-btn up"   onClick={() => handlePredict(c, 'up')}>📈 Up</button>
                    <button id={`pred-down-${c.id}`} className="dir-btn down" onClick={() => handlePredict(c, 'down')}>📉 Down</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
