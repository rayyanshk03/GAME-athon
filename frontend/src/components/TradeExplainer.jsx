import { useState } from 'react';
import { explainTrade as generateTradeExplanation, getImprovementTip } from '../api/apiClient';
import { usePortfolio } from '../context/PortfolioContext';

// ── Parse the structured ## Section response from Gemini ──────────────────────
function parseSections(text) {
  if (!text) return [];
  const sectionRegex = /^(#{1,3}\s*.+)$/gm;
  const lines = text.split('\n');
  const sections = [];
  let current = null;

  for (const line of lines) {
    if (/^#{1,3}\s/.test(line)) {
      if (current) sections.push(current);
      current = { header: line.replace(/^#{1,3}\s*/, '').trim(), body: [] };
    } else if (current) {
      current.body.push(line);
    }
  }
  if (current) sections.push(current);

  // If no sections found, treat the whole text as a single block
  if (!sections.length) return [{ header: null, body: text.split('\n') }];
  return sections;
}

// ── Determine accent colour per section header emoji ────────────────────────
function sectionAccent(header) {
  if (!header) return '#6366f1';
  if (header.includes('📈') || header.includes('✅')) return '#22c55e';
  if (header.includes('📉') || header.includes('❌')) return '#ef4444';
  if (header.includes('⚖️')) return '#f59e0b';
  if (header.includes('🔍')) return '#a78bfa';
  if (header.includes('🎯')) return '#38bdf8';
  return '#6366f1';
}

// ── Format action-plan lines as a step list ───────────────────────────────────
function renderBody(lines, isActionPlan) {
  const clean = lines.filter(l => l.trim());
  if (isActionPlan) {
    return (
      <ol style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {clean.map((l, i) => (
          <li key={i} style={{ color: 'var(--text)', fontSize: '0.875rem', lineHeight: 1.55 }}>
            {l.replace(/^\d+\.\s*/, '')}
          </li>
        ))}
      </ol>
    );
  }
  return clean.map((l, i) => (
    <p key={i} style={{ margin: '0.25rem 0', color: 'var(--muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
      {l}
    </p>
  ));
}

// ── Section card ──────────────────────────────────────────────────────────────
function SectionCard({ header, body }) {
  const accent = sectionAccent(header);
  const isAction = header && header.includes('🎯');
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${accent}33`,
      borderLeft: `3px solid ${accent}`,
      borderRadius: '10px',
      padding: '0.85rem 1rem',
    }}>
      {header && (
        <p style={{ margin: '0 0 0.5rem', fontWeight: 700, fontSize: '0.9rem', color: accent, letterSpacing: '0.01em' }}>
          {header}
        </p>
      )}
      {renderBody(body, isAction)}
    </div>
  );
}

// ── Trade metric chip ─────────────────────────────────────────────────────────
function MetricChip({ label, value, color }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      background: 'rgba(255,255,255,0.04)', borderRadius: '8px',
      padding: '0.5rem 0.75rem', flex: 1, minWidth: '70px',
    }}>
      <span style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontSize: '1rem', fontWeight: 700, color: color ?? 'var(--text)', marginTop: '0.15rem' }}>{value}</span>
    </div>
  );
}

// ── Skeleton placeholder while loading ────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      {[...Array(5)].map((_, i) => (
        <div key={i} style={{
          height: i === 4 ? '90px' : '70px',
          borderRadius: '10px',
          background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
          borderLeft: '3px solid rgba(255,255,255,0.1)',
        }} />
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function TradeExplainer() {
  const { tradeHistory, winRate, bestSector, worstSector, avgMultiplier } = usePortfolio();
  const [analysis,    setAnalysis]    = useState(null);
  const [tip,         setTip]         = useState('');
  const [loading,     setLoading]     = useState(false);
  const [tipLoading,  setTipLoading]  = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);

  const trade = tradeHistory[selectedIdx];

  const pct = trade && trade.entryPrice && trade.exitPrice
    ? (((trade.exitPrice - trade.entryPrice) / trade.entryPrice) * 100).toFixed(2)
    : null;

  async function handleExplain() {
    if (!trade) return;
    setLoading(true);
    setAnalysis(null);
    try {
      const text = await generateTradeExplanation(trade);
      setAnalysis(text);
    } catch (e) {
      setAnalysis(`⚠️ AI error: ${e.message}`);
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

  const sections = analysis ? parseSections(analysis) : [];

  return (
    <div className="ai-page" id="trade-explainer">

      {/* ── Trade Post-Mortem ─────────────────────────────────────── */}
      <div className="panel">
        <h2 className="panel-title">🤖 AI Trade Post-Mortem</h2>

        {tradeHistory.length === 0 ? (
          <p className="empty-state">
            Place and resolve some trades first — the AI will analyse them here.
          </p>
        ) : (
          <>
            {/* Trade selector */}
            <div className="form-group">
              <label>Select Trade</label>
              <select
                id="trade-selector"
                value={selectedIdx}
                onChange={e => { setSelectedIdx(Number(e.target.value)); setAnalysis(null); }}
              >
                {tradeHistory.slice(0, 10).map((t, i) => (
                  <option key={i} value={i}>
                    {t.symbol} — {t.won ? '✅ Won' : '❌ Lost'} {t.pointDelta > 0 ? '+' : ''}{t.pointDelta} pts
                    {t.entryPrice && t.exitPrice
                      ? ` (${(((t.exitPrice - t.entryPrice) / t.entryPrice) * 100).toFixed(1)}%)`
                      : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Trade metrics strip */}
            {trade && (
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
                <MetricChip label="Symbol"    value={trade.symbol} />
                <MetricChip label="Direction" value={trade.direction?.toUpperCase() ?? '—'}
                  color={trade.direction === 'up' ? '#22c55e' : '#ef4444'} />
                <MetricChip label="Result"    value={trade.won ? '+' + trade.pointDelta + ' pts' : trade.pointDelta + ' pts'}
                  color={trade.won ? '#22c55e' : '#ef4444'} />
                {pct && <MetricChip label="Move" value={pct + '%'}
                  color={parseFloat(pct) >= 0 ? '#22c55e' : '#ef4444'} />}
                <MetricChip label="Multiplier" value={trade.multiplier + '×'} />
                {trade.sector && <MetricChip label="Sector" value={trade.sector} />}
              </div>
            )}

            <button
              id="explain-btn"
              className="btn-primary"
              onClick={handleExplain}
              disabled={loading}
              style={{ marginBottom: '0.85rem' }}
            >
              {loading ? '🧠 Analysing trade…' : '✨ Analyse Trade'}
            </button>

            {/* Loading skeleton */}
            {loading && <SkeletonCard />}

            {/* Structured sections */}
            {!loading && sections.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {sections.map((s, i) => (
                  <SectionCard key={i} header={s.header} body={s.body} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Personalised Tip ─────────────────────────────────────── */}
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

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
