/**
 * TradingViewChart.jsx
 *
 * Embeds the official TradingView Advanced Real-Time Chart widget (tv.js).
 * - Candlestick by default, all chart types available via toolbar
 * - Built-in symbol search (allow_symbol_change: true)
 * - Real-time data from TradingView
 * - Script loads only once, widget reinitialises when symbol changes
 */

import { useEffect, useRef } from 'react';

let tvScriptLoaded = false;
let tvScriptLoading = false;
const tvScriptCallbacks = [];

function loadTVScript(callback) {
  if (tvScriptLoaded) { callback(); return; }
  tvScriptCallbacks.push(callback);
  if (tvScriptLoading) return;
  tvScriptLoading = true;
  const script = document.createElement('script');
  script.src = 'https://s3.tradingview.com/tv.js';
  script.async = true;
  script.onload = () => {
    tvScriptLoaded = true;
    tvScriptLoading = false;
    tvScriptCallbacks.forEach(cb => cb());
    tvScriptCallbacks.length = 0;
  };
  document.head.appendChild(script);
}

export default function TradingViewChart({ symbol = 'NSE:RELIANCE', theme = 'dark', height = 520 }) {
  const containerRef = useRef(null);
  const widgetRef    = useRef(null);

  useEffect(() => {
    const containerId = `tv_chart_${Math.random().toString(36).slice(2)}`;
    if (containerRef.current) containerRef.current.id = containerId;

    function initWidget() {
      if (!containerRef.current || typeof window.TradingView === 'undefined') return;

      // Destroy previous widget instance if any
      if (widgetRef.current) {
        try { widgetRef.current.remove?.(); } catch {}
        widgetRef.current = null;
      }

      // Clear the container so TradingView can repopulate it
      if (containerRef.current) containerRef.current.innerHTML = '';

      widgetRef.current = new window.TradingView.widget({
        autosize:            true,
        symbol:              symbol,
        interval:            'D',          // Daily candles default
        timezone:            'Asia/Kolkata',
        theme:               theme,
        style:               '1',          // 1 = Candlestick
        locale:              'en',
        toolbar_bg:          '#0D1526',

        // ── Groww-style: clean focused chart ─────────────────────
        hide_side_toolbar:   true,         // remove left drawing tools bar
        details:             false,        // remove right stock info panel
        hotlist:             false,        // remove hotlist tab
        calendar:            false,        // remove earnings calendar tab
        studies:             [],           // no pre-loaded sub-pane indicators
        // ──────────────────────────────────────────────────────────

        enable_publishing:   false,
        allow_symbol_change: true,         // keep built-in symbol search
        save_image:          true,
        withdateranges:      true,         // keep 1D 5D 1M 3M 6M YTD 1Y 5Y All buttons
        show_popup_button:   false,
        container_id:        containerId,
      });
    }

    loadTVScript(initWidget);

    return () => {
      if (widgetRef.current) {
        try { widgetRef.current.remove?.(); } catch {}
        widgetRef.current = null;
      }
    };
  }, [symbol, theme]);

  return (
    <div
      style={{
        width:        '100%',
        height:       `${height}px`,
        borderRadius: '12px',
        overflow:     'hidden',
        background:   '#0F172A',
        border:       '1px solid rgba(51,65,85,0.6)',
        boxShadow:    '0 4px 32px rgba(0,0,0,0.4)',
      }}
    >
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
