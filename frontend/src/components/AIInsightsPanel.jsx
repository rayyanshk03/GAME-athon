import { useState, useEffect, useCallback } from 'react';
import { getRecommendations } from '../api/apiClient';
import { usePortfolio } from '../context/PortfolioContext';
import { useData } from '../context/StockDataContext';
import { useGamification } from '../context/GamificationContext';

export default function AIInsightsPanel() {
  const { pendingBets } = usePortfolio();
  const { stocks } = useData();
  const { activeBets } = useGamification();
  const [recommendations, setRecommendations] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchInsights = useCallback(async () => {
    if (!stocks.length) return;
    setLoading(true);
    try {
      const openSymbols = [...new Set([...activeBets, ...pendingBets].map((b) => b.symbol))];
      const available = stocks.map((s) => ({ symbol: s.symbol, sector: s.sector || 'Equity' }));
      const result = await getRecommendations(openSymbols, available);
      setRecommendations(result);
    } catch (e) {
      setRecommendations(`⚠️ Could not load insights: ${e.message || e}`);
    }
    setLoading(false);
  }, [stocks, activeBets, pendingBets]);

  useEffect(() => {
    if (stocks.length === 0) return;
    fetchInsights();
  }, [stocks.length, fetchInsights]);

  if (!stocks.length) {
    return (
      <div className="panel">
        <h3 className="panel-title">🧠 AI Market Insights</h3>
        <p className="muted" style={{ fontSize: '0.85rem' }}>Loading market data…</p>
      </div>
    );
  }

  return (
    <div className="panel">
      <h3 className="panel-title">🧠 AI Market Insights</h3>
      <p className="panel-desc" style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '1rem' }}>
        Recommendations use your open bets and live tickers. If the AI API is busy, offline tips load instantly.
      </p>

      <button type="button" id="btn-fetch-insights" className="btn-secondary" onClick={fetchInsights} disabled={loading} style={{ marginBottom: '0.75rem' }}>
        {loading ? 'Loading…' : '🔄 Refresh insights'}
      </button>

      {loading && (
        <div className="loading-bar">
          <div className="loading-fill" />
        </div>
      )}

      {recommendations && (
        <div className="ai-result typewriter" style={{ marginTop: '0' }}>
          {recommendations.split('\n').map((line, i) => (
            <p key={i} style={{ marginBottom: '0.5rem' }}>{line}</p>
          ))}
        </div>
      )}
    </div>
  );
}
