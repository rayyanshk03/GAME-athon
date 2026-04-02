import { useCrowd } from '../context/CrowdIntelligenceContext';
import { STOCKS, SENTIMENT_DATA } from '../data/mockData';

export default function CrowdIntelligenceDashboard() {
  const { votes, userVotes, castVote, getHybridScore } = useCrowd();

  return (
    <div className="crowd-page" id="crowd-intelligence">
      <h2 className="section-title">🌐 Crowd Intelligence</h2>

      {/* Sentiment feed */}
      <div className="panel">
        <h3 className="panel-title">📰 Live Sentiment Feed</h3>
        <div className="sentiment-feed">
          {SENTIMENT_DATA.map((item, i) => (
            <div key={i} className={`sentiment-item sentiment-${item.sentiment}`}>
              <div className="sentiment-header">
                <span className="sentiment-icon">{item.sentiment === 'positive' ? '📈' : item.sentiment === 'negative' ? '📉' : '⚖️'}</span>
                <span className="sentiment-source">{item.source}</span>
                <span className="sentiment-stock">{item.stock}</span>
              </div>
              <div className="sentiment-headline">{item.headline}</div>
              <div className="sentiment-bar-track">
                <div className="sentiment-bar-fill" style={{ width: `${Math.abs(item.impact) * 100}%`, background: item.impact > 0 ? 'var(--success)' : 'var(--danger)' }} />
              </div>
              <span className="sentiment-score">Impact: {(item.impact * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Crowd voting heatmap */}
      <div className="panel">
        <h3 className="panel-title">🗳️ Crowd Votes — Will it go up or down?</h3>
        <div className="crowd-grid">
          {STOCKS.map(s => {
            const score   = getHybridScore(s.symbol);
            const voted   = userVotes[s.symbol];
            const vData   = votes[s.symbol] || { bullish: 0, bearish: 0 };
            const total   = vData.bullish + vData.bearish;
            const bullPct = total ? Math.round((vData.bullish / total) * 100) : 50;

            return (
              <div key={s.symbol} className="crowd-card" id={`crowd-${s.symbol}`}>
                <div className="crowd-symbol">{s.symbol}</div>
                <div className="crowd-price">${s.price}</div>
                <div className="hybrid-score" style={{ color: score.direction === 'bullish' ? 'var(--success)' : score.direction === 'bearish' ? 'var(--danger)' : 'var(--muted)' }}>
                  {score.direction.toUpperCase()} · {score.score}/100
                </div>
                <div className="vote-bar-track">
                  <div className="vote-bar-bull" style={{ width: `${bullPct}%` }} />
                </div>
                <div className="vote-labels">
                  <span className="bull-lbl">🟢 {bullPct}%</span>
                  <span className="bear-lbl">{100 - bullPct}% 🔴</span>
                </div>
                {!voted ? (
                  <div className="vote-btns">
                    <button id={`vote-bull-${s.symbol}`} className="dir-btn up"   onClick={() => castVote(s.symbol, 'bullish')}>📈 Bullish</button>
                    <button id={`vote-bear-${s.symbol}`} className="dir-btn down" onClick={() => castVote(s.symbol, 'bearish')}>📉 Bearish</button>
                  </div>
                ) : (
                  <div className="voted-tag">✅ Voted {voted}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
