import { useState, useEffect, useCallback, useRef } from 'react';
import { getRecommendations } from '../api/apiClient';
import { usePortfolio } from '../context/PortfolioContext';
import { useData } from '../context/StockDataContext';
import { useGamification } from '../context/GamificationContext';

// ── Parse the structured recommendation text into cards ────────────────
function parseInsights(text) {
  if (!text) return null;
  const lines  = text.split('\n').map(l => l.trim()).filter(Boolean);
  const cards  = [];
  const tips   = [];
  const others = [];

  for (const line of lines) {
    if (line.startsWith('✅') || line.startsWith('👀') || line.startsWith('⛔')) {
      const [, rest] = line.split(/[\s]/);  // skip emoji
      const emoji = line[0];
      const body  = line.slice(emoji.length === 1 ? 2 : 3).trim(); // "BUY: AAPL — reason"
      const match = body.match(/^(BUY|WATCH|AVOID):\s*([A-Z]+)\s*[—\-–]\s*(.+)/i);
      if (match) {
        cards.push({
          type:   match[1].toUpperCase(),
          symbol: match[2],
          reason: match[3],
          emoji,
          color:  match[1] === 'BUY' ? '#10B981' : match[1] === 'WATCH' ? '#F59E0B' : '#EF4444',
          bg:     match[1] === 'BUY' ? 'rgba(16,185,129,0.1)' : match[1] === 'WATCH' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
        });
        continue;
      }
    }
    if (line.startsWith('💡') || line.startsWith('📌') || line.startsWith('⚡') || line.startsWith('🎯') || line.startsWith('📊') || line.startsWith('🧠') || line.startsWith('🔄') || line.startsWith('⏱️')) {
      tips.push(line);
      continue;
    }
    // Skip the header line "🤖 AI Market Brief"
    if (!line.startsWith('🤖')) others.push(line);
  }

  return { cards, tips, others };
}

// ── Typewriter hook ────────────────────────────────────────────────────
function useTypewriter(text, speed = 18) {
  const [display, setDisplay] = useState('');
  const idx = useRef(0);
  useEffect(() => {
    setDisplay('');
    idx.current = 0;
    if (!text) return;
    const id = setInterval(() => {
      idx.current += 1;
      setDisplay(text.slice(0, idx.current));
      if (idx.current >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return display;
}

export default function AIInsightsPanel() {
  const { pendingBets   } = usePortfolio();
  const { stocks        } = useData();
  const { activeBets    } = useGamification();
  const [raw,     setRaw]     = useState('');
  const [loading, setLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchInsights = useCallback(async () => {
    if (!stocks.length) return;
    setLoading(true);
    try {
      const openSymbols = [...new Set([...activeBets, ...pendingBets].map(b => b.symbol))];
      const available   = stocks.map(s => ({ symbol: s.symbol, sector: s.sector || 'Equity' }));
      const result      = await getRecommendations(openSymbols, available);
      setRaw(result);
      setLastFetch(new Date());
    } catch (e) {
      setRaw(`⚠️ Could not load insights: ${e.message || e}`);
    }
    setLoading(false);
  }, [stocks, activeBets, pendingBets]);

  useEffect(() => {
    if (stocks.length > 0) fetchInsights();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stocks.length]);

  const parsed = parseInsights(raw);
  const tipText = parsed?.tips?.[0] ?? '';
  const animatedTip = useTypewriter(tipText, 20);

  const timeStr = lastFetch
    ? lastFetch.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  if (!stocks.length) {
    return (
      <div className="panel">
        <h3 className="panel-title">🧠 AI Market Insights</h3>
        <p className="muted" style={{ fontSize: '0.85rem' }}>Loading market data…</p>
      </div>
    );
  }

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 className="panel-title" style={{ margin: 0 }}>🧠 AI Market Insights</h3>
        {timeStr && (
          <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
            Updated {timeStr}
          </span>
        )}
      </div>

      {/* Refresh button */}
      <button
        type="button"
        id="btn-fetch-insights"
        className="btn-secondary"
        onClick={fetchInsights}
        disabled={loading}
        style={{ width: '100%', padding: '0.45rem', fontSize: '0.82rem' }}
      >
        {loading ? (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <span className="spinner" style={{
              display: 'inline-block', width: 12, height: 12,
              border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
              borderRadius: '50%', animation: 'spin 0.7s linear infinite',
            }} />
            Analysing market…
          </span>
        ) : '🔄 Refresh insights'}
      </button>

      {loading && (
        <div className="loading-bar"><div className="loading-fill" /></div>
      )}

      {/* Recommendation Cards */}
      {parsed?.cards?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {parsed.cards.map((c, i) => (
            <div key={i} style={{
              background: c.bg,
              border: `1px solid ${c.color}33`,
              borderLeft: `3px solid ${c.color}`,
              borderRadius: 8,
              padding: '0.55rem 0.75rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
            }}>
              <span style={{ fontSize: 18, lineHeight: 1.2 }}>{c.emoji}</span>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: c.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>{c.type}</span>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#E2E8F0' }}>{c.symbol}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#94A3B8', lineHeight: 1.4 }}>{c.reason}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Other lines (context/holding info) */}
      {parsed?.others?.map((line, i) => (
        <p key={i} style={{ margin: 0, fontSize: '0.78rem', color: '#64748B' }}>{line}</p>
      ))}

      {/* Animated Pro Tip */}
      {tipText && (
        <div style={{
          background: 'rgba(59,130,246,0.08)',
          border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: 8,
          padding: '0.55rem 0.75rem',
          fontSize: '0.8rem',
          color: '#93C5FD',
          lineHeight: 1.5,
          minHeight: 42,
        }}>
          {animatedTip}
          {animatedTip.length < tipText.length && (
            <span style={{ opacity: 0.6, animation: 'blink 1s step-end infinite' }}>|</span>
          )}
        </div>
      )}

      {/* Fallback if nothing parsed yet */}
      {!parsed && !loading && raw && (
        <div className="ai-result" style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
          {raw.split('\n').map((line, i) => <p key={i} style={{ marginBottom: '0.4rem' }}>{line}</p>)}
        </div>
      )}

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes blink { 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}
