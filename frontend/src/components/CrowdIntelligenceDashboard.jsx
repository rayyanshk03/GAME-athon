/**
 * PeopleDashboard.jsx  (was CrowdIntelligenceDashboard.jsx)
 *
 * Simplified "People" page — shows ONLY community voting patterns.
 * No simulation mode selector, no SPY news feed, no flash contests.
 */

import { useCrowd } from '../context/CrowdIntelligenceContext';
import { useData }  from '../context/StockDataContext';

// ── Sentiment helper (used for hybrid-score colour) ───────────────────────────
function scoreColor(direction) {
  if (direction === 'bullish') return '#22c55e';
  if (direction === 'bearish') return '#ef4444';
  return 'var(--muted)';
}

export default function PeopleDashboard() {
  const { votes, userVotes, castVote, getHybridScore } = useCrowd();
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
                        onClick={() => castVote(s.symbol, 'bullish')}
                      >
                        📈 Bullish
                      </button>
                      <button
                        id={`vote-bear-${s.symbol}`}
                        className="dir-btn down"
                        onClick={() => castVote(s.symbol, 'bearish')}
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
