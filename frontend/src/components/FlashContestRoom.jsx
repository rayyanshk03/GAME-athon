import { useState, useEffect } from 'react';
import { useCrowd } from '../context/CrowdIntelligenceContext';
import { useGamification } from '../context/GamificationContext';
import { STOCKS } from '../data/mockData';
import { resolveContest } from '../engine/HybridSignalEngine';

const CONTEST_DURATION = 5 * 60 * 1000; // 5 minutes for demo (plan says 15m)

function formatTime(ms) {
  if (ms <= 0) return '00:00';
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function FlashContestRoom() {
  const { contests, addContest, joinContest } = useCrowd();
  const { points, earnPoints } = useGamification();
  const [ticks, setTicks]         = useState(0);
  const [results, setResults]     = useState({});   // { contestId: resultObject }
  const [confettiId, setConfettiId] = useState(null);

  // Tick every second to update countdowns
  useEffect(() => {
    const t = setInterval(() => setTicks(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Auto-resolve contests when timer expires
  useEffect(() => {
    contests.forEach(c => {
      if (results[c.id]) return;
      const elapsed = Date.now() - c.startedAt;
      if (elapsed >= CONTEST_DURATION && c.participants.length > 0) {
        const currentPrices = Object.fromEntries(STOCKS.map(s => [s.symbol, s.price * (1 + (Math.random() * 0.06 - 0.03))]));
        const result = resolveContest(c, currentPrices);
        setResults(prev => ({ ...prev, [c.id]: result }));
        if (result?.winner?.isCurrentUser) {
          earnPoints(c.prizePool || 100);
          setConfettiId(c.id);
          setTimeout(() => setConfettiId(null), 4000);
        }
      }
    });
  }, [ticks]); // eslint-disable-line

  function createContest() {
    const stock     = STOCKS[Math.floor(Math.random() * STOCKS.length)];
    const prizePool = Math.floor(Math.random() * 150 + 50);
    addContest({ symbol: stock.symbol, entryPrice: stock.price, prizePool, maxParticipants: 10 });
  }

  function handleJoin(contestId, direction) {
    const stock = STOCKS.find(s => s.symbol === contests.find(c => c.id === contestId)?.symbol);
    joinContest({ contestId, direction, entryPrice: stock?.price || 100, isCurrentUser: true, name: 'You' });
  }

  const activeContests  = contests.filter(c => !results[c.id] && Date.now() - c.startedAt < CONTEST_DURATION);
  const finishedContests = contests.filter(c => results[c.id]);

  return (
    <div className="panel flash-panel" id="flash-contest-room">
      <div className="panel-header">
        <h2 className="panel-title">🏆 Flash Contest Rooms</h2>
        <button id="create-contest-btn" className="btn-primary" style={{ width: 'auto' }} onClick={createContest}>
          + New Contest
        </button>
      </div>
      <p className="social-desc">Predict a stock direction in {CONTEST_DURATION / 60000} minutes. Top predictor wins the prize pool!</p>

      {/* Active contests */}
      {activeContests.length === 0 && finishedContests.length === 0 && (
        <p className="empty-state">No active contests. Click "+ New Contest" to start one!</p>
      )}

      <div className="contests-grid">
        {activeContests.map(c => {
          const elapsed    = Date.now() - c.startedAt;
          const remaining  = Math.max(0, CONTEST_DURATION - elapsed);
          const progress   = (elapsed / CONTEST_DURATION) * 100;
          const joined     = c.participants.some(p => p.isCurrentUser);
          const isUrgent   = remaining < 60000;

          return (
            <div key={c.id} className={`contest-card live ${isUrgent ? 'urgent' : ''}`}>
              {confettiId === c.id && <div className="confetti-overlay">🎉🎊🎉🎊🎉</div>}

              <div className="contest-header">
                <div className="contest-stock">{c.symbol}</div>
                <div className="prize-pool">🎁 {c.prizePool} pts</div>
              </div>

              <div className="contest-price">${c.entryPrice?.toFixed(2)}</div>

              <div className="contest-timer-wrap">
                <div className={`contest-timer ${isUrgent ? 'urgent' : ''}`}>{formatTime(remaining)}</div>
                <div className="timer-bar-track">
                  <div className="timer-bar-fill" style={{ width: `${100 - progress}%` }} />
                </div>
              </div>

              <div className="contest-participants">
                👥 {c.participants.length} / {c.maxParticipants} joined
              </div>

              {!joined ? (
                <div className="contest-join-btns">
                  <button id={`join-up-${c.id}`}   className="dir-btn up"   onClick={() => handleJoin(c.id, 'up')}>  📈 Up   </button>
                  <button id={`join-down-${c.id}`} className="dir-btn down" onClick={() => handleJoin(c.id, 'down')}>📉 Down</button>
                </div>
              ) : (
                <div className="joined-tag">✅ You're in! Waiting for result…</div>
              )}
            </div>
          );
        })}

        {/* Finished contests */}
        {finishedContests.slice(0, 4).map(c => {
          const res    = results[c.id];
          const youWon = res?.winner?.isCurrentUser;
          return (
            <div key={c.id} className={`contest-card finished ${youWon ? 'won' : 'lost'}`}>
              <div className="contest-header">
                <div className="contest-stock">{c.symbol}</div>
                <div className={`contest-result-tag ${youWon ? 'win' : 'loss'}`}>
                  {youWon ? '🏆 You Won!' : '❌ Ended'}
                </div>
              </div>
              {res?.winner && (
                <div className="contest-winner">
                  Winner: <strong>{res.winner.isCurrentUser ? 'You' : res.winner.name || 'Anonymous'}</strong>
                  &nbsp;({res.winner.pct?.toFixed(2)}%)
                </div>
              )}
              {youWon && <div className="prize-awarded">+{c.prizePool} pts awarded! 🎉</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
