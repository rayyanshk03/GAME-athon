import { useState } from 'react';
import { explainTrade as generateTradeExplanation, getImprovementTip } from '../api/apiClient';
import { usePortfolio } from '../context/PortfolioContext';

export default function TradeExplainer() {
  const { tradeHistory, winRate, bestSector, worstSector, avgMultiplier } = usePortfolio();
  const [explanation, setExplanation] = useState('');
  const [tip, setTip] = useState('');
  const [loading, setLoading] = useState(false);
  const [tipLoading, setTipLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [cooldown, setCooldown] = useState(0);   // seconds remaining

  const trade = tradeHistory[selectedIdx];

  function startCooldown(secs = 10) {
    setCooldown(secs);
    const t = setInterval(() => {
      setCooldown(prev => { if (prev <= 1) { clearInterval(t); return 0; } return prev - 1; });
    }, 1000);
  }

  async function handleExplain() {
    if (!trade) return;
    setLoading(true);
    setExplanation('');
    try {
      const result = await generateTradeExplanation(trade);
      setExplanation(result);
      startCooldown(10);
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
      startCooldown(10);
    } catch (e) {
      setTip(`⚠️ AI error: ${e.message}`);
    }
    setTipLoading(false);
  }

  return (
    <div className="ai-page" id="trade-explainer">
      <div className="panel">
        <h2 className="panel-title">🤖 AI Trade Post-Mortem</h2>
        {tradeHistory.length === 0 ? (
          <p className="empty-state">Place some trades first — the AI will analyse them here.</p>
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
            <button id="explain-btn" className="btn-primary" onClick={handleExplain} disabled={loading || cooldown > 0}>
              {loading ? '🧠 Analysing…' : cooldown > 0 ? `⏳ Wait ${cooldown}s` : '✨ Analyse Trade'}
            </button>
            {loading && <div className="loading-bar"><div className="loading-fill" /></div>}
            {explanation && <div className="ai-result typewriter"><p>{explanation}</p></div>}
          </>
        )}
      </div>

      <div className="panel">
        <h2 className="panel-title">💡 Personalised Improvement Tip</h2>
        <button id="tip-btn" className="btn-secondary" onClick={handleTip} disabled={tipLoading || cooldown > 0}>
          {tipLoading ? '🧠 Analysing your stats…' : cooldown > 0 ? `⏳ Wait ${cooldown}s` : '🔍 Get My Tip'}
        </button>
        {tipLoading && <div className="loading-bar"><div className="loading-fill" /></div>}
        {tip && <div className="ai-result"><p>{tip}</p></div>}
      </div>
    </div>
  );
}
