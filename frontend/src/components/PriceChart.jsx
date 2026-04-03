/**
 * PriceChart.jsx — Pro TradingView-style Chart
 * Uses lightweight-charts by TradingView.
 * Supports Candlestick, Bar, and Line series + Volume pane.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, CandlestickSeries, HistogramSeries, LineSeries, BarSeries } from 'lightweight-charts';

// ── Colors ──────────────────────────────────────────────────────────
const UP_COLOR   = '#10B981';
const DOWN_COLOR = '#EF4444';
const BG_COLOR   = 'transparent';
const GRID_COLOR = '#1E293B';
const TEXT_COLOR = '#94A3B8';
const BORDER_COLOR = '#1E293B';

// ── Timeframe helper ─────────────────────────────────────────────────
const TIMEFRAMES = ['1D','1W','1M','YTD','1Y','ALL'];

function sliceByTimeframe(data, tf) {
  if (!data || data.length === 0) return data;
  const now = new Date();
  let cutoff;
  if (tf === '1D')  cutoff = new Date(now - 1  * 86400000);
  else if (tf === '1W')  cutoff = new Date(now - 7  * 86400000);
  else if (tf === '1M')  cutoff = new Date(now - 30 * 86400000);
  else if (tf === 'YTD') cutoff = new Date(now.getFullYear(), 0, 1);
  else if (tf === '1Y')  cutoff = new Date(now - 365 * 86400000);
  else return data;

  const cutoffStr = cutoff.toISOString().split('T')[0];
  const filtered = data.filter(d => d.time >= cutoffStr);
  return filtered.length >= 2 ? filtered : data.slice(-30);
}

// ── Built-in mock data (rendered immediately) ────────────────────────
function buildMockOHLCV(basePrice = 189) {
  const data = [];
  let price = basePrice * 0.92;
  const now = new Date();
  for (let i = 89; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const open  = price;
    const move  = price * (Math.random() * 0.04 - 0.019);
    const close = Math.max(open + move, 1);
    const high  = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low   = Math.min(open, close) * (1 - Math.random() * 0.01);
    const vol   = Math.floor(Math.random() * 5e7 + 1e7);
    data.push({
      time:  d.toISOString().split('T')[0],
      open:  +open.toFixed(2),
      high:  +high.toFixed(2),
      low:   +low.toFixed(2),
      close: +close.toFixed(2),
      value: vol,
    });
    price = close;
  }
  return data;
}

// ── Chart types ──────────────────────────────────────────────────────
const CHART_TYPES = [
  { id: 'candlestick', label: '🕯️' , title: 'Candlestick' },
  { id: 'bar',         label: '📊' , title: 'Bar' },
  { id: 'line',        label: '➖' , title: 'Line' },
];

export default function PriceChart({ chartData, stockName = '', symbol = '' }) {
  const containerRef = useRef(null);
  const chartRef     = useRef(null);
  const mainRef      = useRef(null);
  const volRef       = useRef(null);

  const [tf,        setTf]        = useState('3M');
  const [chartType, setChartType] = useState('candlestick');
  const [tooltip,   setTooltip]   = useState(null);

  // Derive OHLCV data — use prop if provided, else mock
  const rawData = (chartData && chartData.length >= 2)
    ? chartData.map(d => ({
        time:  d.time,
        open:  d.open  ?? d.price,
        high:  d.high  ?? d.price * 1.005,
        low:   d.low   ?? d.price * 0.995,
        close: d.close ?? d.price,
        value: d.volume ?? d.value ?? 0,
      }))
    : buildMockOHLCV();

  const ALL_TF = [...TIMEFRAMES, '3M'];

  const visibleData = sliceByTimeframe(rawData, tf);

  // ── Build / Rebuild Chart ──────────────────────────────────────────
  const buildChart = useCallback(() => {
    if (!containerRef.current) return;

    // Destroy old
    if (chartRef.current) {
      try { chartRef.current.remove(); } catch {}
      chartRef.current = null;
      mainRef.current  = null;
      volRef.current   = null;
    }

    const el = containerRef.current;
    const chart = createChart(el, {
      width:  el.clientWidth,
      height: el.clientHeight || 340,
      layout: {
        background: { color: BG_COLOR },
        textColor:  TEXT_COLOR,
        fontSize:   11,
        fontFamily: "'Inter', 'Outfit', sans-serif",
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: GRID_COLOR, style: 1 },
      },
      rightPriceScale: {
        borderColor: BORDER_COLOR,
        scaleMarginTop: 0.1,
        scaleMarginBottom: 0.3,
      },
      timeScale: {
        borderColor: BORDER_COLOR,
        timeVisible: true,
        secondsVisible: false,
        fixLeftEdge:  true,
        fixRightEdge: true,
      },
      crosshair: {
        mode: 1,
        vertLine: { color: '#475569', width: 1, style: 2, labelBackgroundColor: '#1E293B' },
        horzLine: { color: '#475569', width: 1, style: 2, labelBackgroundColor: '#1E293B' },
      },
      handleScroll:  { mouseWheel: true, pressedMouseMove: true },
      handleScale:   { mouseWheel: true, axisPressedMouseMove: true },
    });

    // ── Main price series ────────────────────────────────────────────
    let mainSeries;

    if (chartType === 'candlestick') {
      mainSeries = chart.addSeries(CandlestickSeries, {
        upColor:          UP_COLOR,
        downColor:        DOWN_COLOR,
        borderUpColor:    UP_COLOR,
        borderDownColor:  DOWN_COLOR,
        wickUpColor:      UP_COLOR,
        wickDownColor:    DOWN_COLOR,
        priceScaleId:     'right',
      });
    } else if (chartType === 'bar') {
      mainSeries = chart.addSeries(BarSeries, {
        upColor:    UP_COLOR,
        downColor:  DOWN_COLOR,
        thinBars:   false,
        priceScaleId: 'right',
      });
    } else {
      mainSeries = chart.addSeries(LineSeries, {
        color:       UP_COLOR,
        lineWidth:   2,
        priceScaleId: 'right',
      });
    }

    // ── Volume histogram ─────────────────────────────────────────────
    const volSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'vol',
      lastValueVisible: false,
      priceLineVisible: false,
    });
    chart.priceScale('vol').applyOptions({
      scaleMarginTop:    0.75,
      scaleMarginBottom: 0,
    });

    // ── Set data ─────────────────────────────────────────────────────
    const priceData = chartType === 'line'
      ? visibleData.map(d => ({ time: d.time, value: d.close }))
      : visibleData.map(d => ({ time: d.time, open: d.open, high: d.high, low: d.low, close: d.close }));

    const volData = visibleData.map(d => ({
      time:  d.time,
      value: d.value,
      color: (d.close >= d.open) ? UP_COLOR + '99' : DOWN_COLOR + '99',
    }));

    mainSeries.setData(priceData);
    volSeries.setData(volData);

    chart.timeScale().fitContent();

    // ── Crosshair tooltip ────────────────────────────────────────────
    chart.subscribeCrosshairMove(param => {
      if (!param || !param.time || param.point?.x < 0) {
        setTooltip(null);
        return;
      }
      const pricePoint = param.seriesData.get(mainSeries);
      const volPoint   = param.seriesData.get(volSeries);
      if (!pricePoint) { setTooltip(null); return; }

      setTooltip({
        time:  param.time,
        open:  pricePoint.open  ?? pricePoint.value,
        high:  pricePoint.high  ?? pricePoint.value,
        low:   pricePoint.low   ?? pricePoint.value,
        close: pricePoint.close ?? pricePoint.value,
        vol:   volPoint?.value  ?? 0,
        up:    (pricePoint.close ?? pricePoint.value) >= (pricePoint.open ?? pricePoint.value),
      });
    });

    // ── Resize observer ──────────────────────────────────────────────
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        chart.applyOptions({ width: entry.contentRect.width });
      }
    });
    ro.observe(el);

    chartRef.current = chart;
    mainRef.current  = mainSeries;
    volRef.current   = volSeries;

    return () => { ro.disconnect(); };
  }, [chartType, visibleData.length, tf]); // eslint-disable-line

  useEffect(() => {
    const cleanup = buildChart();
    return () => {
      cleanup?.();
      if (chartRef.current) {
        try { chartRef.current.remove(); } catch {}
        chartRef.current = null;
      }
    };
  }, [buildChart]);

  // ── Format helpers ──────────────────────────────────────────────────
  const fmt  = v => v != null ? `$${Number(v).toFixed(2)}` : '—';
  const fmtV = v => v ? (v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `${(v/1e3).toFixed(0)}K` : v) : '—';

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, width: '100%' }}>

      {/* ── Toolbar ───────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 4px 10px', gap: 8, flexWrap: 'wrap',
      }}>
        {/* Timeframes */}
        <div style={{ display: 'flex', gap: 4 }}>
          {TIMEFRAMES.map(t => (
            <button
              key={t}
              onClick={() => setTf(t)}
              style={{
                padding: '3px 10px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: tf === t ? 700 : 400,
                background: tf === t ? 'rgba(59,130,246,0.25)' : 'transparent',
                color: tf === t ? '#60A5FA' : '#64748B',
                transition: 'all 0.15s',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Chart Type Toggles */}
        <div style={{ display: 'flex', gap: 4 }}>
          {CHART_TYPES.map(ct => (
            <button
              key={ct.id}
              title={ct.title}
              onClick={() => setChartType(ct.id)}
              style={{
                padding: '3px 10px',
                borderRadius: 6,
                border: chartType === ct.id ? '1px solid rgba(59,130,246,0.5)' : '1px solid transparent',
                cursor: 'pointer',
                fontSize: 15,
                background: chartType === ct.id ? 'rgba(59,130,246,0.15)' : 'transparent',
                color: chartType === ct.id ? '#60A5FA' : '#64748B',
                transition: 'all 0.15s',
              }}
            >
              {ct.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── OHLCV Tooltip bar ─────────────────────────────────────── */}
      <div style={{
        height: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '0 4px',
        fontSize: 11.5,
        fontFamily: "'JetBrains Mono','Fira Mono',monospace",
        color: tooltip ? (tooltip.up ? UP_COLOR : DOWN_COLOR) : '#475569',
        marginBottom: 4,
        minHeight: 24,
        letterSpacing: 0.3,
      }}>
        {tooltip ? (
          <>
            <span style={{ color: '#94A3B8', marginRight: 4 }}>{tooltip.time}</span>
            <span>O: <strong>{fmt(tooltip.open)}</strong></span>
            <span>H: <strong>{fmt(tooltip.high)}</strong></span>
            <span>L: <strong>{fmt(tooltip.low)}</strong></span>
            <span>C: <strong style={{ color: tooltip.up ? UP_COLOR : DOWN_COLOR }}>{fmt(tooltip.close)}</strong></span>
            <span style={{ color: '#94A3B8' }}>Vol: {fmtV(tooltip.vol)}</span>
          </>
        ) : (
          <span style={{ color: '#334155', fontSize: 11 }}>Hover over chart to see OHLCV data</span>
        )}
      </div>

      {/* ── Chart container ───────────────────────────────────────── */}
      <div
        ref={containerRef}
        id="tradingview-chart"
        style={{ width: '100%', height: 340, borderRadius: 8, overflow: 'hidden' }}
      />
    </div>
  );
}
