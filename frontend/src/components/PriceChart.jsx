/**
 * PriceChart.jsx — Pro TradingView-style Chart
 *
 * Architecture: TWO separate chart instances stacked vertically.
 * - Top chart (70%):  Candlestick / Bar / Line
 * - Bottom chart (30%): Volume histogram
 * - Time scales are synced bidirectionally so panning/zooming is unified.
 *
 * This is the only 100% reliable way to get non-overlapping price + volume
 * in lightweight-charts regardless of version.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  BarSeries,
} from 'lightweight-charts';

// ─── Theme ────────────────────────────────────────────────────────────
const UP    = '#10B981';
const DOWN  = '#EF4444';
const GRID  = 'rgba(30,41,59,0.7)';
const TEXT  = '#94A3B8';
const BDR   = '#1E293B';

// ─── Timeframes ───────────────────────────────────────────────────────
const TIMEFRAMES = [
  { label: '1D',  days: 1   },
  { label: '1W',  days: 7   },
  { label: '1M',  days: 30  },
  { label: '3M',  days: 90  },
  { label: 'YTD', days: null },
  { label: '1Y',  days: 365 },
  { label: 'ALL', days: null },
];

const CHART_TYPES = [
  { id: 'candlestick', label: '🕯️', title: 'Candlestick' },
  { id: 'bar',         label: '📊', title: 'Bar'         },
  { id: 'line',        label: '➖', title: 'Line'        },
];

function toStr(date) { return date.toISOString().split('T')[0]; }

function getRange(label) {
  const now = new Date();
  if (label === 'ALL') return null;
  if (label === 'YTD') return { from: `${now.getFullYear()}-01-01`, to: toStr(now) };
  const tf = TIMEFRAMES.find(t => t.label === label);
  if (!tf?.days) return null;
  return { from: toStr(new Date(now - tf.days * 86400000)), to: toStr(now) };
}

// ─── Mock OHLCV (when no prop) ─────────────────────────────────────────
function buildMockOHLCV(base = 189, count = 160) {
  const data = []; let p = base * 0.88;
  const now = new Date();
  for (let i = count + 60; i >= 0 && data.length < count; i--) {
    const d = new Date(now - i * 86400000);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const open  = +p.toFixed(2);
    p += p * (Math.random() * 0.042 - 0.02);
    p = Math.max(p, base * 0.5);
    const close = +p.toFixed(2);
    data.push({
      time:  toStr(d),
      open,
      high:  +(Math.max(open, close) * (1 + Math.random() * 0.009)).toFixed(2),
      low:   +(Math.min(open, close) * (1 - Math.random() * 0.009)).toFixed(2),
      close,
      value: Math.floor(Math.random() * 6e7 + 5e6),
    });
  }
  return data;
}

// ─── Shared chart config ───────────────────────────────────────────────
function baseChartOptions(width) {
  return {
    width,
    layout:    { background: { color: 'transparent' }, textColor: TEXT, fontSize: 11, fontFamily: "'Inter',sans-serif" },
    grid:      { vertLines: { visible: false }, horzLines: { color: GRID } },
    crosshair: { mode: 1, vertLine: { color: '#475569', width: 1, style: 2, labelBackgroundColor: BDR }, horzLine: { color: '#475569', width: 1, style: 2, labelBackgroundColor: BDR } },
    handleScroll: { mouseWheel: true, pressedMouseMove: true },
    handleScale:  { mouseWheel: true, axisPressedMouseMove: true },
  };
}

// ─── Component ─────────────────────────────────────────────────────────
export default function PriceChart({ chartData, symbol = '' }) {
  const priceEl  = useRef(null);
  const volEl    = useRef(null);
  const priceRef = useRef(null);
  const volRef   = useRef(null);
  const mainSer  = useRef(null);
  const volSer   = useRef(null);
  const syncLock = useRef(false);

  const [tf,        setTf]        = useState('3M');
  const [chartType, setChartType] = useState('candlestick');
  const [tooltip,   setTooltip]   = useState(null);

  // ── Normalise data (always all candles) ──────────────────────────────
  const allData = (() => {
    const src = (chartData?.length >= 2)
      ? chartData.map(d => ({
          time:  d.time,
          open:  +(d.open  ?? d.price).toFixed(2),
          high:  +(d.high  ?? (d.price * 1.005)).toFixed(2),
          low:   +(d.low   ?? (d.price * 0.995)).toFixed(2),
          close: +(d.close ?? d.price).toFixed(2),
          value: d.volume ?? d.value ?? 0,
        }))
      : buildMockOHLCV();
    const seen = new Set();
    return src.filter(d => { if (seen.has(d.time)) return false; seen.add(d.time); return true; });
  })();

  // Unique key that changes whenever the underlying data changes
  const dataKey = `${symbol}|${allData[0]?.time ?? ''}|${allData[allData.length - 1]?.time ?? ''}|${allData.length}`;

  // ── Destroy helper ───────────────────────────────────────────────────
  function destroyCharts() {
    if (priceRef.current) { try { priceRef.current.remove(); } catch {} priceRef.current = null; }
    if (volRef.current)   { try { volRef.current.remove();   } catch {} volRef.current   = null; }
    mainSer.current = null;
    volSer.current  = null;
  }

  // ── Build both charts ────────────────────────────────────────────────
  const buildCharts = useCallback(() => {
    if (!priceEl.current || !volEl.current) return;
    destroyCharts();

    const w = priceEl.current.clientWidth;

    // ── PRICE chart ────────────────────────────────────────────────────
    const pchart = createChart(priceEl.current, {
      ...baseChartOptions(w),
      height: 280,
      rightPriceScale: { borderColor: BDR, scaleMarginTop: 0.05, scaleMarginBottom: 0.02 },
      timeScale: { borderColor: BDR, visible: false }, // hide time axis on price chart
    });

    let ms;
    if (chartType === 'candlestick') {
      ms = pchart.addSeries(CandlestickSeries, {
        upColor: UP, downColor: DOWN,
        borderUpColor: UP, borderDownColor: DOWN,
        wickUpColor: UP, wickDownColor: DOWN,
      });
    } else if (chartType === 'bar') {
      ms = pchart.addSeries(BarSeries, { upColor: UP, downColor: DOWN });
    } else {
      ms = pchart.addSeries(LineSeries, { color: UP, lineWidth: 2 });
    }

    const priceData = chartType === 'line'
      ? allData.map(d => ({ time: d.time, value: d.close }))
      : allData.map(d => ({ time: d.time, open: d.open, high: d.high, low: d.low, close: d.close }));

    ms.setData(priceData);

    // ── VOLUME chart ───────────────────────────────────────────────────
    const vchart = createChart(volEl.current, {
      ...baseChartOptions(w),
      height: 90,
      rightPriceScale: { borderColor: BDR, scaleMarginTop: 0.1, scaleMarginBottom: 0.02, drawTicks: false, borderVisible: false },
      timeScale: { borderColor: BDR, timeVisible: true, secondsVisible: false },
    });

    const vs = vchart.addSeries(HistogramSeries, {
      lastValueVisible: false,
      priceLineVisible: false,
      priceFormat: { type: 'volume' },
    });

    vs.setData(allData.map(d => ({
      time:  d.time,
      value: d.value,
      color: d.close >= d.open ? UP + 'CC' : DOWN + 'CC',
    })));

    pchart.timeScale().fitContent();
    vchart.timeScale().fitContent();

    // ── Sync time scales bidirectionally ──────────────────────────────
    pchart.timeScale().subscribeVisibleLogicalRangeChange(range => {
      if (syncLock.current || !range) return;
      syncLock.current = true;
      vchart.timeScale().setVisibleLogicalRange(range);
      syncLock.current = false;
    });
    vchart.timeScale().subscribeVisibleLogicalRangeChange(range => {
      if (syncLock.current || !range) return;
      syncLock.current = true;
      pchart.timeScale().setVisibleLogicalRange(range);
      syncLock.current = false;
    });

    // ── Crosshair tooltip ─────────────────────────────────────────────
    pchart.subscribeCrosshairMove(p => {
      if (!p?.time || (p.point?.x ?? -1) < 0) { setTooltip(null); return; }
      const pp = p.seriesData.get(ms);
      if (!pp) { setTooltip(null); return; }
      setTooltip({
        time:  p.time,
        open:  pp.open  ?? pp.value,
        high:  pp.high  ?? pp.value,
        low:   pp.low   ?? pp.value,
        close: pp.close ?? pp.value,
        up:   (pp.close ?? pp.value) >= (pp.open ?? pp.value),
      });
    });
    vchart.subscribeCrosshairMove(p => {
      if (!p?.time) return;
      const vp = p.seriesData.get(vs);
      setTooltip(prev => prev ? { ...prev, vol: vp?.value ?? prev.vol } : null);
    });

    // ── Resize ────────────────────────────────────────────────────────
    const ro = new ResizeObserver(entries => {
      const nw = entries[0]?.contentRect.width;
      if (nw) { pchart.applyOptions({ width: nw }); vchart.applyOptions({ width: nw }); }
    });
    ro.observe(priceEl.current.parentElement);

    priceRef.current = pchart;
    volRef.current   = vchart;
    mainSer.current  = ms;
    volSer.current   = vs;

    return () => ro.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartType, dataKey]);

  useEffect(() => {
    const cleanup = buildCharts();
    return () => { cleanup?.(); destroyCharts(); };
  }, [buildCharts]);

  // ── Timeframe zoom ────────────────────────────────────────────────────
  useEffect(() => {
    if (!priceRef.current || !volRef.current) return;
    if (tf === 'ALL') {
      priceRef.current.timeScale().fitContent();
      volRef.current.timeScale().fitContent();
      return;
    }
    const range = getRange(tf);
    if (!range) { priceRef.current.timeScale().fitContent(); volRef.current.timeScale().fitContent(); return; }
    try { priceRef.current.timeScale().setVisibleRange(range); } catch { priceRef.current.timeScale().fitContent(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tf]);

  const fmt  = v => v != null ? `$${Number(v).toFixed(2)}` : '—';
  const fmtV = v => !v ? '—' : v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `${(v/1e3).toFixed(0)}K` : `${v}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 0 }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 2px 8px', flexWrap: 'wrap', gap: 4 }}>
        <div style={{ display: 'flex', gap: 2 }}>
          {TIMEFRAMES.map(({ label }) => (
            <button key={label} onClick={() => setTf(label)} style={{
              padding: '3px 9px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12,
              fontWeight: tf === label ? 700 : 400,
              background: tf === label ? 'rgba(59,130,246,0.2)' : 'transparent',
              color: tf === label ? '#60A5FA' : '#64748B', transition: 'all 0.15s',
            }}>{label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {CHART_TYPES.map(ct => (
            <button key={ct.id} title={ct.title} onClick={() => setChartType(ct.id)} style={{
              padding: '3px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 15,
              border: chartType === ct.id ? '1px solid rgba(59,130,246,0.5)' : '1px solid transparent',
              background: chartType === ct.id ? 'rgba(59,130,246,0.15)' : 'transparent',
              color: chartType === ct.id ? '#60A5FA' : '#64748B', transition: 'all 0.15s',
            }}>{ct.label}</button>
          ))}
        </div>
      </div>

      {/* OHLCV tooltip row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '0 2px 6px', fontSize: 11.5, fontFamily: "'JetBrains Mono','Fira Mono',monospace", letterSpacing: 0.3, minHeight: 20 }}>
        {tooltip ? (
          <>
            <span style={{ color: '#64748B' }}>{tooltip.time}</span>
            <span style={{ color: '#94A3B8' }}>O: <strong style={{ color: '#E2E8F0' }}>{fmt(tooltip.open)}</strong></span>
            <span style={{ color: '#94A3B8' }}>H: <strong style={{ color: UP   }}>{fmt(tooltip.high)}</strong></span>
            <span style={{ color: '#94A3B8' }}>L: <strong style={{ color: DOWN }}>{fmt(tooltip.low)}</strong></span>
            <span style={{ color: '#94A3B8' }}>C: <strong style={{ color: tooltip.up ? UP : DOWN }}>{fmt(tooltip.close)}</strong></span>
            {tooltip.vol != null && <span style={{ color: '#64748B' }}>Vol: {fmtV(tooltip.vol)}</span>}
          </>
        ) : (
          <span style={{ color: '#334155', fontSize: 11 }}>Hover to see OHLCV</span>
        )}
      </div>

      {/* Price chart — top pane */}
      <div ref={priceEl} style={{ width: '100%', borderRadius: '8px 8px 0 0', overflow: 'hidden' }} />

      {/* Divider */}
      <div style={{ height: 1, background: BDR, width: '100%' }} />

      {/* Volume chart — bottom pane */}
      <div ref={volEl} style={{ width: '100%', borderRadius: '0 0 8px 8px', overflow: 'hidden' }} />

    </div>
  );
}
