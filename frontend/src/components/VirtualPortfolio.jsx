import { useState, useEffect, useCallback } from 'react';
import { useVirtualPortfolio } from '../context/VirtualPortfolioContext';
import { useData } from '../context/StockDataContext';

/* ── Formatters ──────────────────────────────────────────────── */
const fmt   = (n) => Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct = (n) => `${n >= 0 ? '+' : ''}${Number(n).toFixed(2)}%`;

/* ── Mini Sparkline (SVG) ────────────────────────────────────── */
function Sparkline({ data, color }) {
  if (!data || data.length < 2) return null;
  const vals  = data.map(d => d.totalValue);
  const min   = Math.min(...vals);
  const max   = Math.max(...vals);
  const range = (max - min) || 1;
  const W = 300, H = 56, pad = 4;
  const pts = vals.map((v, i) => {
    const x = pad + (i / (vals.length - 1)) * (W - pad * 2);
    const y = H - pad - ((v - min) / range) * (H - pad * 2);
    return `${x},${y}`;
  }).join(' ');
  const fill = `${pts} ${W - pad},${H - pad} ${pad},${H - pad}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 56 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="vpGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={fill} fill="url(#vpGrad)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

/* ── PnL Badge ───────────────────────────────────────────────── */
function PnlBadge({ value, pct, size = 'md' }) {
  const pos = value >= 0;
  const col = pos ? 'var(--success)' : 'var(--danger)';
  return (
    <span style={{ color: col, fontWeight: 700, fontSize: size === 'lg' ? '1.1rem' : '0.85rem' }}>
      {pos ? '+' : ''}V₹{fmt(Math.abs(value))}
      {pct !== undefined && <span style={{ fontSize: '0.75em', marginLeft: 4 }}>({fmtPct(pct)})</span>}
    </span>
  );
}

/* ── Main Component ──────────────────────────────────────────── */
export default function VirtualPortfolio() {
  const {
    cash, holdings, transactions, valueHistory, startingCash,
    buyStock, sellStock, recordSnapshot, resetPortfolio, getPortfolioStats,
  } = useVirtualPortfolio();
  const { stocks } = useData();

  /* live price map */
  const livePrices = Object.fromEntries((stocks || []).map(s => [s.symbol, s.price]));
  const stats = getPortfolioStats(livePrices);
  const { totalValue, totalPnL, pnlPercent, holdingsWithLive } = stats;

  /* buy/sell form state */
  const [mode,     setMode]     = useState('buy');
  const [symbol,   setSymbol]   = useState(stocks?.[0]?.symbol || '');
  const [qty,      setQty]      = useState('');
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');
  const [activeSection, setActiveSection] = useState('trade'); // 'trade' | 'holdings' | 'history'

  /* sync default symbol when stocks load */
  useEffect(() => {
    if (stocks?.length && !symbol) setSymbol(stocks[0].symbol);
  }, [stocks, symbol]);

  /* take a portfolio snapshot every 60s */
  useEffect(() => {
    const id = setInterval(() => recordSnapshot(totalValue), 60_000);
    return () => clearInterval(id);
  }, [totalValue, recordSnapshot]);

  const currentStock = (stocks || []).find(s => s.symbol === symbol) || stocks?.[0];
  const price        = currentStock?.price ?? 0;
  const ownedHolding = holdings.find(h => h.symbol === symbol);
  const maxSellQty   = ownedHolding?.shares ?? 0;
  const estTotal     = qty ? (Number(qty) * price).toFixed(2) : '0.00';

  /* ── Buy handler ──────────────────────────────────────────── */
  function handleBuy() {
    setError(''); setSuccess('');
    const q = Number(qty);
    if (!q || q <= 0)           { setError('Enter a valid quantity.'); return; }
    if (!Number.isInteger(q))   { setError('Quantity must be a whole number.'); return; }
    const cost = q * price;
    if (cost > cash)            { setError(`Insufficient cash. You need V₹${fmt(cost)} but have V₹${fmt(cash)}.`); return; }
    buyStock(symbol, q, price);
    recordSnapshot(totalValue - cost + cash);
    setSuccess(`✅ Bought ${q} share(s) of ${symbol} @ V₹${fmt(price)}`);
    setQty('');
    setTimeout(() => setSuccess(''), 3500);
  }

  /* ── Sell handler ─────────────────────────────────────────── */
  function handleSell() {
    setError(''); setSuccess('');
    const q = Number(qty);
    if (!q || q <= 0)           { setError('Enter a valid quantity.'); return; }
    if (!Number.isInteger(q))   { setError('Quantity must be a whole number.'); return; }
    if (q > maxSellQty)         { setError(`You only own ${maxSellQty} share(s) of ${symbol}.`); return; }
    sellStock(symbol, q, price);
    setSuccess(`✅ Sold ${q} share(s) of ${symbol} @ V₹${fmt(price)}`);
    setQty('');
    setTimeout(() => setSuccess(''), 3500);
  }

  const overallColor = totalValue >= startingCash ? 'var(--success)' : 'var(--danger)';

  return (
    <div className="vp-root" id="virtual-portfolio-root">

      {/* ── Portfolio Summary Header ─────────────────────────── */}
      <div className="vp-summary-header">
        <div className="vp-summary-main">
          <div className="vp-summary-title">💼 Virtual Portfolio</div>
          <div className="vp-summary-value" style={{ color: overallColor }}>
            V₹{fmt(totalValue)}
          </div>
          <div className="vp-summary-sub">
            <span>Started with V₹{fmt(startingCash)}</span>
            <span style={{ color: overallColor, fontWeight: 700, marginLeft: 12 }}>
              {totalValue >= startingCash ? '▲' : '▼'} {fmtPct(((totalValue - startingCash) / startingCash) * 100)} overall
            </span>
          </div>
        </div>

        <div className="vp-summary-cards">
          <div className="vp-stat-card">
            <div className="vp-stat-val">V₹{fmt(cash)}</div>
            <div className="vp-stat-label">💵 Available Cash</div>
          </div>
          <div className="vp-stat-card">
            <div className="vp-stat-val">V₹{fmt(stats.holdingsValue)}</div>
            <div className="vp-stat-label">📦 Holdings Value</div>
          </div>
          <div className="vp-stat-card">
            <div className="vp-stat-val" style={{ color: totalPnL >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              {totalPnL >= 0 ? '+' : ''}V₹{fmt(Math.abs(totalPnL))}
            </div>
            <div className="vp-stat-label">📊 Unrealised P&L</div>
          </div>
          <div className="vp-stat-card">
            <div className="vp-stat-val">{holdingsWithLive.length}</div>
            <div className="vp-stat-label">🗂️ Stocks Held</div>
          </div>
        </div>

        {valueHistory.length > 1 && (
          <div className="vp-sparkline-wrap">
            <Sparkline data={valueHistory} color={overallColor} />
          </div>
        )}
      </div>

      {/* ── Section Toggle ───────────────────────────────────── */}
      <div className="vp-section-tabs">
        {[
          { id: 'trade',    label: '⚡ Trade'     },
          { id: 'holdings', label: '📦 Holdings'  },
          { id: 'history',  label: '🗂️ History'   },
        ].map(s => (
          <button
            key={s.id}
            id={`vp-tab-${s.id}`}
            className={`vp-section-tab ${activeSection === s.id ? 'active' : ''}`}
            onClick={() => setActiveSection(s.id)}
          >
            {s.label}
          </button>
        ))}
        <button
          className="vp-reset-btn"
          onClick={() => { if (window.confirm('Reset your virtual portfolio to V₹1,00,000?')) resetPortfolio(); }}
        >
          🔄 Reset
        </button>
      </div>

      {/* ── TRADE PANEL ─────────────────────────────────────── */}
      {activeSection === 'trade' && (
        <div className="vp-trade-layout">

          {/* Left: Buy/Sell Form */}
          <div className="vp-trade-form panel" id="vp-trade-panel">
            <h3 className="panel-title">
              {mode === 'buy' ? '🛒 Buy Shares' : '💸 Sell Shares'}
            </h3>

            <div className="vp-mode-toggle">
              <button
                id="vp-buy-btn"
                className={`vp-mode-btn ${mode === 'buy' ? 'active buy' : ''}`}
                onClick={() => { setMode('buy'); setError(''); setSuccess(''); setQty(''); }}
              >📈 Buy</button>
              <button
                id="vp-sell-btn"
                className={`vp-mode-btn ${mode === 'sell' ? 'active sell' : ''}`}
                onClick={() => { setMode('sell'); setError(''); setSuccess(''); setQty(''); }}
              >📉 Sell</button>
            </div>

            <div className="form-group">
              <label>Select Stock</label>
              <select
                id="vp-stock-select"
                value={symbol}
                onChange={e => { setSymbol(e.target.value); setQty(''); setError(''); }}
              >
                {(stocks || []).map(s => (
                  <option key={s.symbol} value={s.symbol}>
                    {s.symbol} — V₹{Number(s.price).toFixed(2)} ({Number(s.changePercent) >= 0 ? '+' : ''}{Number(s.changePercent).toFixed(2)}%)
                  </option>
                ))}
              </select>
            </div>

            {/* Stock info card */}
            {currentStock && (
              <div className="vp-stock-info">
                <div className="vp-stock-name">{currentStock.name || currentStock.symbol}</div>
                <div className="vp-stock-price">V₹{fmt(currentStock.price)}</div>
                <div style={{ fontSize: '0.78rem', color: Number(currentStock.changePercent) >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                  {Number(currentStock.changePercent) >= 0 ? '▲' : '▼'} {Math.abs(Number(currentStock.changePercent)).toFixed(2)}% today
                </div>
                {mode === 'sell' && maxSellQty > 0 && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 4 }}>
                    You own: <strong>{maxSellQty} shares</strong>
                  </div>
                )}
                {mode === 'sell' && maxSellQty === 0 && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--danger)', marginTop: 4 }}>
                    You don't own any shares of {symbol}
                  </div>
                )}
              </div>
            )}

            <div className="form-group">
              <label>
                Quantity {mode === 'sell' && maxSellQty > 0 &&
                  <span
                    className="vp-max-link"
                    onClick={() => setQty(String(maxSellQty))}
                  >Max ({maxSellQty})</span>
                }
              </label>
              <input
                id="vp-qty-input"
                type="number"
                min="1"
                step="1"
                value={qty}
                onChange={e => setQty(e.target.value)}
                placeholder="No. of shares..."
              />
            </div>

            {/* Cost preview */}
            {qty > 0 && (
              <div className="vp-cost-preview">
                <span>{mode === 'buy' ? 'Total Cost' : 'Proceeds'}</span>
                <strong>V₹{fmt(estTotal)}</strong>
              </div>
            )}
            {mode === 'buy' && qty > 0 && (
              <div className="vp-cost-preview" style={{ opacity: 0.65 }}>
                <span>Remaining Cash</span>
                <strong>V₹{fmt(Math.max(0, cash - Number(estTotal)))}</strong>
              </div>
            )}

            {error   && <p className="form-error">{error}</p>}
            {success && <p className="form-success">{success}</p>}

            <button
              id="vp-confirm-btn"
              className={`btn-primary vp-confirm-btn ${mode}`}
              onClick={mode === 'buy' ? handleBuy : handleSell}
              disabled={!qty || !currentStock || (mode === 'sell' && maxSellQty === 0)}
            >
              {mode === 'buy' ? '🛒 Confirm Buy' : '💸 Confirm Sell'}
            </button>
          </div>

          {/* Right: Holdings quick view */}
          <div className="vp-holdings-mini panel">
            <h3 className="panel-title">📦 Your Holdings</h3>
            {holdingsWithLive.length === 0 ? (
              <div className="vp-empty">
                <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>📂</div>
                <p>No holdings yet.</p>
                <p style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>Buy some stocks to get started!</p>
              </div>
            ) : (
              <div className="vp-holdings-list">
                {holdingsWithLive.map(h => (
                  <div key={h.symbol} className="vp-holding-row">
                    <div className="vp-holding-symbol">{h.symbol}</div>
                    <div className="vp-holding-detail">
                      <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{h.shares} shares @ V₹{fmt(h.avgBuyPrice)}</div>
                      <div style={{ fontWeight: 700 }}>V₹{fmt(h.currentValue)}</div>
                    </div>
                    <div style={{ color: h.pnl >= 0 ? 'var(--success)' : 'var(--danger)', fontSize: '0.82rem', fontWeight: 700 }}>
                      {h.pnl >= 0 ? '+' : ''}V₹{fmt(Math.abs(h.pnl))}
                      <div style={{ fontSize: '0.72rem', fontWeight: 500 }}>{fmtPct(h.pnlPct)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── HOLDINGS TABLE ───────────────────────────────────── */}
      {activeSection === 'holdings' && (
        <div className="panel vp-section-panel" id="vp-holdings-table">
          <h3 className="panel-title">📦 Holdings</h3>
          {holdingsWithLive.length === 0 ? (
            <div className="vp-empty">
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>📂</div>
              <p>No holdings yet. Head to Trade to buy your first stock!</p>
            </div>
          ) : (
            <div className="vp-table-wrap">
              <table className="trade-table vp-table">
                <thead>
                  <tr>
                    <th>Stock</th>
                    <th>Shares</th>
                    <th>Avg Buy</th>
                    <th>Current Price</th>
                    <th>Value</th>
                    <th>Invested</th>
                    <th>P&L</th>
                    <th>P&L %</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {holdingsWithLive.map(h => (
                    <tr key={h.symbol}>
                      <td><strong>{h.symbol}</strong></td>
                      <td>{h.shares}</td>
                      <td>V₹{fmt(h.avgBuyPrice)}</td>
                      <td>V₹{fmt(h.currentPrice)}</td>
                      <td><strong>V₹{fmt(h.currentValue)}</strong></td>
                      <td>V₹{fmt(h.totalInvested)}</td>
                      <td style={{ color: h.pnl >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                        {h.pnl >= 0 ? '+' : ''}V₹{fmt(Math.abs(h.pnl))}
                      </td>
                      <td style={{ color: h.pnlPct >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                        {fmtPct(h.pnlPct)}
                      </td>
                      <td>
                        <button
                          className="btn-resolve"
                          style={{ fontSize: '0.72rem', padding: '3px 10px' }}
                          onClick={() => { setSymbol(h.symbol); setMode('sell'); setActiveSection('trade'); }}
                        >Sell</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ fontWeight: 700 }}>
                    <td colSpan={4}>Total</td>
                    <td>V₹{fmt(stats.holdingsValue)}</td>
                    <td>V₹{fmt(stats.totalInvested)}</td>
                    <td style={{ color: totalPnL >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {totalPnL >= 0 ? '+' : ''}V₹{fmt(Math.abs(totalPnL))}
                    </td>
                    <td style={{ color: pnlPercent >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      {fmtPct(pnlPercent)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TRANSACTION HISTORY ──────────────────────────────── */}
      {activeSection === 'history' && (
        <div className="panel vp-section-panel" id="vp-history-table">
          <h3 className="panel-title">🗂️ Transaction History</h3>
          {transactions.length === 0 ? (
            <div className="vp-empty">
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>📋</div>
              <p>No transactions yet.</p>
            </div>
          ) : (
            <div className="vp-table-wrap">
              <table className="trade-table vp-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Stock</th>
                    <th>Shares</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx.id}>
                      <td style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                        {new Date(tx.ts).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td>
                        <span className={`vp-tx-badge ${tx.type === 'BUY' ? 'buy' : 'sell'}`}>
                          {tx.type === 'BUY' ? '🛒 BUY' : '💸 SELL'}
                        </span>
                      </td>
                      <td><strong>{tx.symbol}</strong></td>
                      <td>{tx.shares}</td>
                      <td>V₹{fmt(tx.price)}</td>
                      <td style={{ fontWeight: 700 }}>V₹{fmt(tx.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
