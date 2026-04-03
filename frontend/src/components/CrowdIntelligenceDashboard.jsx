/**
 * PeopleDashboard.jsx  (was CrowdIntelligenceDashboard.jsx)
 *
 * Simplified "People" page — shows ONLY community voting patterns.
 * No simulation mode selector, no SPY news feed, no flash contests.
 */

import { useCrowd } from '../context/CrowdIntelligenceContext';
import { useData }  from '../context/StockDataContext';

import { useGamification } from '../context/GamificationContext';

// ── Sentiment helper (used for hybrid-score colour) ───────────────────────────
function scoreColor(direction) {
  if (direction === 'bullish') return '#22c55e';
  if (direction === 'bearish') return '#ef4444';
  return 'var(--muted)';
}

export default function PeopleDashboard() {
  const { votes, userVotes, castVote, getHybridScore } = useCrowd();
  const { advanceQuest } = useGamification();
  const { stocks } = useData();

  // Overall community stats
  const totalVotes  = Object.values(votes).reduce((sum, v) => sum + v.bullish + v.bearish, 0);
  const totalBullish = Object.values(votes).reduce((sum, v) => sum + v.bullish, 0);
  const bullishPct   = totalVotes > 0 ? Math.round((totalBullish / totalVotes) * 100) : 50;
  const votedCount   = Object.keys(userVotes).length;

  return (
    <div className="crowd-page" id="people-dashboard">
      <h2 className="section-title">👥 People</h2>
      <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '1.5rem', marginTop: '-0.5rem' }}>
        See how the community is positioning on each stock. Add your vote and track the crowd consensus.
      </p>

      {/* ── Community snapshot bar ────────────────────────────────────── */}
      <div className="panel" style={{ marginBottom: '1.25rem' }}>
        <h3 className="panel-title">📊 Community Snapshot</h3>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#22c55e' }}>{bullishPct}%</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Community Bullish</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ef4444' }}>{100 - bullishPct}%</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Community Bearish</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)' }}>{totalVotes}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Total Votes Cast</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#6366f1' }}>{votedCount}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Your Votes</div>
          </div>
        </div>

        {/* Community sentiment bar */}
        <div style={{ height: 10, borderRadius: 8, background: 'rgba(239,68,68,0.25)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 8,
            background: 'linear-gradient(90deg, #22c55e, #16a34a)',
            width: `${bullishPct}%`, transition: 'width 0.5s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--muted)', marginTop: '0.3rem' }}>
          <span>🟢 Bullish</span>
          <span>Bearish 🔴</span>
        </div>
      </div>

      {/* ── Discord Community Banner ────────────────────────────────────── */}
      <div className="panel" style={{
        marginBottom: '1.25rem',
        background: 'linear-gradient(135deg, rgba(88,101,242,0.1) 0%, rgba(88,101,242,0.02) 100%)',
        border: '1px solid rgba(88,101,242,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem'
      }}>
        <div>
          <h3 style={{ margin: 0, color: '#8ea1eb', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
            <svg width="24" height="24" viewBox="0 0 127.14 96.36" fill="#5865F2">
              <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a67.55,67.55,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14c0,0,.04-.06.09-.09C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.2,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
            </svg>
            <span style={{ color: '#fff', fontWeight: 700 }}>Join the StockQuest Discord</span>
          </h3>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: 'var(--muted)' }}>
            Connect with other traders, discuss strategies, and get live alerts.
          </p>
        </div>
        <a 
          href="https://discord.gg/stockquest" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            background: '#5865F2', color: '#fff', textDecoration: 'none',
            padding: '0.65rem 1.4rem', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600,
            display: 'inline-flex', alignItems: 'center', transition: 'background 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#4752C4'}
          onMouseLeave={e => e.currentTarget.style.background = '#5865F2'}
        >
          Join Server
        </a>
      </div>

      {/* ── Voting grid ───────────────────────────────────────────────── */}
      <div className="panel">
        <h3 className="panel-title">🗳️ Cast Your Vote — Will it go up or down?</h3>

        {!stocks || stocks.length === 0 ? (
          <div className="skeleton-box" style={{ height: 300, borderRadius: 8 }} />
        ) : (
          <div className="crowd-grid">
            {stocks.map(s => {
              const score    = getHybridScore(s.symbol);
              const voted    = userVotes[s.symbol];
              const vData    = votes[s.symbol] || { bullish: 0, bearish: 0 };
              const total    = vData.bullish + vData.bearish;
              const bullPct  = total ? Math.round((vData.bullish / total) * 100) : 50;
              const bearPct  = 100 - bullPct;

              return (
                <div key={s.symbol} className="crowd-card" id={`crowd-${s.symbol}`}>

                  {/* Symbol + price */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                    <div>
                      <div className="crowd-symbol">{s.symbol}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{s.sector ?? ''}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="crowd-price">${Number(s.price).toFixed(2)}</div>
                      <div style={{ fontSize: '0.7rem', color: Number(s.changePercent) >= 0 ? '#22c55e' : '#ef4444' }}>
                        {Number(s.changePercent) >= 0 ? '+' : ''}{Number(s.changePercent ?? 0).toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  {/* Hybrid score */}
                  <div className="hybrid-score" style={{ color: scoreColor(score.direction), marginBottom: '0.5rem' }}>
                    {score.direction.toUpperCase()} · {score.score}/100
                  </div>

                  {/* Vote bar */}
                  <div className="vote-bar-track">
                    <div className="vote-bar-bull" style={{ width: `${bullPct}%` }} />
                  </div>
                  <div className="vote-labels">
                    <span className="bull-lbl">🟢 {bullPct}% ({vData.bullish})</span>
                    <span className="bear-lbl">{bearPct}% ({vData.bearish}) 🔴</span>
                  </div>

                  {/* Vote buttons or voted tag */}
                  {!voted ? (
                    <div className="vote-btns">
                      <button
                        id={`vote-bull-${s.symbol}`}
                        className="dir-btn up"
                        onClick={() => { castVote(s.symbol, 'bullish'); if (advanceQuest) advanceQuest('vote'); }}
                      >
                        📈 Bullish
                      </button>
                      <button
                        id={`vote-bear-${s.symbol}`}
                        className="dir-btn down"
                        onClick={() => { castVote(s.symbol, 'bearish'); if (advanceQuest) advanceQuest('vote'); }}
                      >
                        📉 Bearish
                      </button>
                    </div>
                  ) : (
                    <div className="voted-tag" style={{
                      color: voted === 'bullish' ? '#22c55e' : '#ef4444',
                      background: voted === 'bullish' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                      border: `1px solid ${voted === 'bullish' ? '#22c55e44' : '#ef444444'}`,
                      borderRadius: '6px', padding: '0.35rem 0.5rem', fontSize: '0.78rem',
                      fontWeight: 600, textAlign: 'center',
                    }}>
                      ✅ You voted {voted}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
