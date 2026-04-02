import { useState } from 'react';
import { generateTradeExplanation, getImprovementTip } from '../services/AIFeedbackService';
import { usePortfolio } from '../context/PortfolioContext';

export default function TradeExplainer() {
  const { tradeHistory, winRate, bestSector, worstSector, avgMultiplier } = usePortfolio();
  const [explanation, setExplanation] = useState('');
  const [tip, setTip] = useState('');
  const [loading, setLoading] = useState(false);
  const [tipLoading, setTipLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);

  const trade = tradeHistory[selectedIdx];

  async function handleExplain() {
    if (!trade) return;
    setLoading(true);
    setExplanation('');
    try {
      const result = await generateTradeExplanation(trade);
      setExplanation(result);
    } catch (e) {
      setExplanation('⚠️ Could not fetch AI analysis. Check your API key in .env');
    }
    setLoading(false);
  }

  async function handleTip() {
    setTipLoading(true);
    setTip('');
    try {
      const result = await getImprovementTip({ winRate: winRate || 0, totalTrades: tradeHistory.length, bestSector, worstSector, avgMultiplier: avgMultiplier || 1 });
      setTip(result);
    } catch {
      setTip('⚠️ AI tip unavailable. Add VITE_GEMINI_API_KEY to .env');
    }
    setTipLoading(false);
  }

  return (
    <div className="ai-page" id="trade-explainer">
      <div className="panel">
        <h2 className="panel-title">🤖 AI Trade Post-Mortem</h2>
        {tradeHistory.length === 0 ? (
          <p className="empty-state">Place some trades first — the AI will analyze them here.</p>
        ) : (
          <>
            <div className="form-group">
              <label>Select Trade</label>
              <select id="trade-selector" value={selectedIdx} onChange={e => { setSelectedIdx(Number(e.target.value)); setExplanation(''); }}>
                {tradeHistory.slice(0, 10).map((t, i) => (
                  <option key={i} value={i}>{t.symbol} — {t.won ? '✅ Won' : '❌ Lost'} {t.pointDelta > 0 ? '+' : ''}{t.pointDelta} pts</option>
                ))}
              </select>
            </div>
            <button id="explain-btn" className="btn-primary" onClick={handleExplain} disabled={loading}>
              {loading ? '🧠 AI is analyzing your trade...' : '✨ Analyze Trade'}
            </button>
            {loading && <div className="loading-bar"><div className="loading-fill" /></div>}
            {explanation && (
              <div className="ai-result typewriter">
                <p>{explanation}</p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="panel">
        <h2 className="panel-title">💡 Personalised Improvement Tip</h2>
        <button id="tip-btn" className="btn-secondary" onClick={handleTip} disabled={tipLoading}>
          {tipLoading ? '🧠 Analysing your stats...' : '🔍 Get My Tip'}
        </button>
        {tipLoading && <div className="loading-bar"><div className="loading-fill" /></div>}
        {tip && <div className="ai-result"><p>{tip}</p></div>}
      </div>
    </div>
  );
}
