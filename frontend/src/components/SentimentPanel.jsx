import { useState, useEffect } from 'react';
import { getCompanyNews, getRealSentiment } from '../api/apiClient';

export default function SentimentPanel({ symbol }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!symbol) return;
    setLoading(true);
    getCompanyNews(symbol, 7)
      .then(async (articles) => {
        if (!articles || articles.length === 0) { setNews([]); setLoading(false); return; }
        
        const subset = articles.slice(0, 5);
        
        let results = [];
        try {
          // Pass the symbol so FinBERT analyzes sentiment towards THIS specific stock
          results = await getRealSentiment(subset, symbol);
        } catch (err) {
          console.error("Sentiment API call failed:", err);
        }

        const processed = subset.map((a, i) => {
          const ai = results?.[i] || { sentiment: 'neutral', impact: 0 };
          return {
            source: a.source || 'Reuters',
            headline: a.headline,
            url: a.url || '',
            stock: symbol,
            sentiment: ai.sentiment,
            impact: ai.impact
          };
        });
        setNews(processed);
        setLoading(false);
      })
      .catch(() => {
        setNews([]);
        setLoading(false);
      });
  }, [symbol]);

  return (
    <div className="panel">
      <h3 className="panel-title">📰 NLP Sentiment Analysis — {symbol}</h3>
      
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="skeleton-box" style={{ height: 60, width: '100%', borderRadius: 8 }} />
          <div className="skeleton-box" style={{ height: 60, width: '100%', borderRadius: 8 }} />
          <div className="skeleton-box" style={{ height: 60, width: '100%', borderRadius: 8 }} />
        </div>
      ) : news.length === 0 ? (
        <p className="empty-state">No recent news for {symbol}.</p>
      ) : (
        <div className="sentiment-feed" style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '0.5rem' }}>
          {news.map((item, i) => (
            <div key={i} className={`sentiment-item sentiment-${item.sentiment}`} style={{ marginBottom: '0.5rem' }}>
              <div className="sentiment-header">
                <span className="sentiment-icon">
                  {item.sentiment === 'positive' ? '📈' : item.sentiment === 'negative' ? '📉' : '⚖️'}
                </span>
                <span className="sentiment-source">{item.source}</span>
                <span className="sentiment-stock">{item.stock}</span>
              </div>

              {/* Headline — clickable link to original article */}
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sentiment-headline"
                  style={{
                    display: 'block',
                    color: 'var(--text)',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text)'}
                >
                  {item.headline} <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>🔗</span>
                </a>
              ) : (
                <div className="sentiment-headline">{item.headline}</div>
              )}

              <div className="sentiment-bar-track">
                <div 
                  className="sentiment-bar-fill" 
                  style={{ 
                    width: `${Math.abs(item.impact) * 100}%`, 
                    background: item.impact > 0 ? 'var(--success)' : item.impact < 0 ? 'var(--danger)' : 'var(--muted)' 
                  }} 
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="sentiment-score">
                  {item.sentiment === 'positive' ? '🟢' : item.sentiment === 'negative' ? '🔴' : '🟡'}{' '}
                  Impact on {item.stock}: {item.impact > 0 ? '+' : ''}{(item.impact * 100).toFixed(0)}%
                </span>
                {item.url && (
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.65rem', color: 'var(--primary)', textDecoration: 'none' }}
                  >
                    Read full article →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
