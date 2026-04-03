import { useState } from 'react';
import { explainTrade as generateTradeExplanation, getImprovementTip } from '../api/apiClient';
import { usePortfolio } from '../context/PortfolioContext';

export default function TradeExplainer() {
  const { tradeHistory, winRate, bestSector, worstSector, avgMultiplier } = usePortfolio();
  const [explanation, setExplanation]     = useState('');
  const [tip,         setTip]             = useState('');
  const [loading,     setLoading]         = useState(false);
  const [tipLoading,  setTipLoading]      = useState(false);
  const [selectedIdx, setSelectedIdx]     = useState(0);

  const trade = tradeHistory[selectedIdx];

  async function handleExplain() {
    if (!trade) return;
    setLoading(true);
    setExplanation('');
    try {
      const result = await generateTradeExplanation(trade);
      setExplanation(result);
    } catch (e) {
      setExplanation(`⚠️ AI error: ${e.message}`);
    }
    setLoading(false);
  }

  async function handleTip() {
    setTipLoading(true);
    setTip('');
    try {
      const result = await getImprovementTip({
        winRate:       winRate       ?? 0,
        totalTrades:   tradeHistory.length,
        bestSector:    bestSector   ?? 'N/A',
        worstSector:   worstSector  ?? 'N/A',
        avgMultiplier: avgMultiplier ?? 1,
      });
      setTip(result);
    } catch (e) {
      setTip(`⚠️ AI error: ${e.message}`);
    }
    setTipLoading(false);
  }

  return (
    <div className="ai-page" id="trade-explainer">
      {/* ── Trade Post-Mortem ─────────────────────────────────── */}
      <div className="panel">
        <h2 className="panel-title">🤖 AI Trade Post-Mortem</h2>
        {tradeHistory.length === 0 ? (
          <p className="empty-state">
            Place and resolve some trades first — the AI will analyse them here.
          </p>
        ) : (
          <>
            <div className="form-group">
              <label>Select Trade</label>
              <select
                id="trade-selector"
                value={selectedIdx}
                onChange={e => { setSelectedIdx(Number(e.target.value)); setExplanation(''); }}
              >
                {tradeHistory.slice(0, 10).map((t, i) => (
                  <option key={i} value={i}>
                    {t.symbol} — {t.won ? '✅ Won' : '❌ Lost'} {t.pointDelta > 0 ? '+' : ''}{t.pointDelta} pts
                  </option>
                ))}
              </select>
            </div>

            <button
              id="explain-btn"
              className="btn-primary"
              onClick={handleExplain}
              disabled={loading}
            >
              {loading ? '🧠 Analysing…' : '✨ Analyse Trade'}
            </button>

            {loading && <div className="loading-bar"><div className="loading-fill" /></div>}

            {explanation && (
              <div className="ai-result typewriter" style={{ marginTop: '0.75rem' }}>
                {explanation.split('\n').map((line, i) => (
                  <p key={i} style={{ marginBottom: line ? '0.4rem' : 0 }}>{line}</p>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Personalised Tip ─────────────────────────────────── */}
      <div className="panel">
        <h2 className="panel-title">💡 Personalised Improvement Tip</h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>
          Based on your win rate ({winRate ?? 0}%) and {tradeHistory.length} settled trade{tradeHistory.length !== 1 ? 's' : ''}.
        </p>

        <button
          id="tip-btn"
          className="btn-secondary"
          onClick={handleTip}
          disabled={tipLoading}
        >
          {tipLoading ? '🧠 Analysing your stats…' : '🔍 Get My Tip'}
        </button>

        {tipLoading && <div className="loading-bar"><div className="loading-fill" /></div>}

        {tip && (
          <div className="ai-result" style={{ marginTop: '0.75rem' }}>
            {tip.split('\n').map((line, i) => (
              <p key={i} style={{ marginBottom: line ? '0.4rem' : 0 }}>{line}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
