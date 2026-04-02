import { useState, useEffect } from 'react';
import { useCrowd } from '../context/CrowdIntelligenceContext';
import { useData } from '../context/StockDataContext';
import { getCompanyNews } from '../api/apiClient';

function guessSentiment(text) {
  const t = text.toLowerCase();
  const bullish = ['surges','rises','beats','record','growth','gains','strong','upgrade','buy','profit','up','boom','deal','win'];
  const bearish  = ['falls','drops','miss','recall','slump','decline','investigation','lawsuit','downgrade','loss','cut','down','crash','weak'];
  if (bullish.some(w => t.includes(w))) return { sentiment: 'positive', impact: 0.4 + (Math.random() * 0.4) };
  if (bearish.some(w => t.includes(w))) return { sentiment: 'negative', impact: -0.4 - (Math.random() * 0.4) };
  return { sentiment: 'neutral', impact: (Math.random() * 0.2) - 0.1 };
}

export default function CrowdIntelligenceDashboard() {
  const { votes, userVotes, castVote, getHybridScore } = useCrowd();
  const { stocks } = useData();
  const [marketNews, setMarketNews] = useState([]);

  useEffect(() => {
    // Fetch SPY (S&P 500) news to act as general market sentiment
    getCompanyNews('SPY', 3)
      .then(articles => {
        if (!articles) return;
        const processed = articles.slice(0, 5).map(a => {
          const { sentiment, impact } = guessSentiment(a.headline + ' ' + (a.summary || ''));
          return {
            source: a.source || 'Market',
            headline: a.headline,
            stock: 'SPY / Market',
            sentiment,
            impact
          };
        });
        setMarketNews(processed);
      })
      .catch(() => setMarketNews([]));
  }, []);

  return (
    <div className="crowd-page" id="crowd-intelligence">
      <h2 className="section-title">🌐 Crowd Intelligence</h2>

      {/* Sentiment feed */}
      <div className="panel">
        <h3 className="panel-title">📰 Live Market Sentiment (SPY)</h3>
        {marketNews.length === 0 ? (
          <div className="skeleton-box" style={{height: 100, borderRadius: 8}}></div>
        ) : (
          <div className="sentiment-feed">
            {marketNews.map((item, i) => (
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
        )}
      </div>

      {/* Crowd voting heatmap */}
      <div className="panel">
        <h3 className="panel-title">🗳️ Crowd Votes — Will it go up or down?</h3>
        {!stocks || stocks.length === 0 ? (
          <div className="skeleton-box" style={{height: 300, borderRadius: 8}}></div>
        ) : (
          <div className="crowd-grid">
            {stocks.map(s => {
              const score   = getHybridScore(s.symbol);
              const voted   = userVotes[s.symbol];
              const vData   = votes[s.symbol] || { bullish: 0, bearish: 0 };
              const total   = vData.bullish + vData.bearish;
              const bullPct = total ? Math.round((vData.bullish / total) * 100) : 50;

              return (
                <div key={s.symbol} className="crowd-card" id={`crowd-${s.symbol}`}>
                  <div className="crowd-symbol">{s.symbol}</div>
                  <div className="crowd-price">${Number(s.price).toFixed(2)}</div>
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
        )}
      </div>
    </div>
  );
}
