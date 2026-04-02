import { useState, useEffect, useRef, useCallback } from 'react';
import { getQuote, getHistory } from '../services/FinnhubService';
import { STOCKS as MOCK_STOCKS, generateDailyFallbackHistory } from '../data/mockData';

const TARGET_TICKERS = ['AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'NFLX', 'AMD', 'SPY'];

const historyCache = {};

function cacheKey(symbol, days) {
  return `${symbol}_${days}`;
}

export function peekCachedHistory(symbol, days) {
  return historyCache[cacheKey(symbol, days)] || null;
}

const HISTORY_DAYS = 90;

export function useStockData(pollIntervalMs = 60000) {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  const timerRef = useRef(null);
  const visibleRef = useRef(true);
  const stocksRef = useRef(stocks);
  stocksRef.current = stocks;

  useEffect(() => {
    const handleVisibility = () => {
      visibleRef.current = document.visibilityState === 'visible';
      if (visibleRef.current) fetchQuotes();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    fetchQuotes();

    timerRef.current = setInterval(() => {
      if (visibleRef.current) fetchQuotes();
    }, pollIntervalMs);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(timerRef.current);
    };
  }, [pollIntervalMs]);

  async function fetchQuotes() {
    try {
      const results = await Promise.all(
        TARGET_TICKERS.map(async (sym) => {
          try {
            const q = await getQuote(sym);
            if (q && q.c) {
              return {
                symbol: sym,
                name: sym,
                price: q.c,
                change: q.d,
                changePercent: q.dp,
                open: q.o,
                high: q.h,
                low: q.l,
                volume: Math.floor(Math.random() * 5000000) + 1000000,
              };
            }
          } catch (err) {
            console.warn(`Failed fetching quote for ${sym}`);
          }
          return null;
        })
      );

      let valid = results.filter((r) => r !== null);
      if (valid.length === 0) {
        const bySym = new Map(MOCK_STOCKS.map((s) => [s.symbol, s]));
        valid = TARGET_TICKERS.map((sym) => {
          const row = bySym.get(sym);
          const h = sym.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
          const price = row?.price ?? 45 + (h % 450);
          return {
            symbol: sym,
            name: row?.name ?? sym,
            price,
            change: row?.change ?? 0,
            changePercent: row?.changePercent ?? 0,
            open: price,
            high: price,
            low: price,
            volume: 1_000_000 + (h % 4_000_000),
          };
        });
      }
      setStocks(valid);
      setLoading(false);
      setError(null);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  const fetchStockHistory = useCallback(async (symbol, days = 30) => {
    const key = cacheKey(symbol, days);
    if (historyCache[key]) return historyCache[key];

    const stockRow = stocksRef.current.find((s) => s.symbol === symbol);
    const basePrice = stockRow?.price ?? 150;

    try {
      const data = await getHistory(symbol, 'D', days);
      if (data.s === 'ok' && data.c && data.c.length > 0) {
        const formatted = data.c.map((closePrice, index) => {
          const d = new Date(data.t[index] * 1000);
          return {
            time: d.getTime(),
            dateLabel: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            price: closePrice,
            open: data.o[index],
            high: data.h[index],
            low: data.l[index],
            volume: data.v[index],
          };
        });
        historyCache[key] = formatted;
        return formatted;
      }
    } catch (err) {
      console.warn(`Failed fetching history for ${symbol}`, err);
    }

    const formatted = generateDailyFallbackHistory(basePrice, days, symbol);
    historyCache[key] = formatted;
    return formatted;
  }, []);

  useEffect(() => {
    if (!loading && stocks.length > 0 && !selectedSymbol) {
      setSelectedSymbol(stocks[0].symbol);
    }
  }, [loading, stocks, selectedSymbol]);

  useEffect(() => {
    if (!selectedSymbol) return;

    const cached = peekCachedHistory(selectedSymbol, HISTORY_DAYS);
    if (cached?.length) {
      setHistory(cached);
      setHistoryError(null);
    }

    setHistoryLoading(true);
    setHistoryError(null);
    let cancelled = false;

    fetchStockHistory(selectedSymbol, HISTORY_DAYS).then((data) => {
      if (cancelled) return;
      setHistory(data);
      setHistoryLoading(false);
      if (!data?.length) setHistoryError('Chart data unavailable');
    });

    return () => {
      cancelled = true;
    };
  }, [selectedSymbol, fetchStockHistory]);

  return {
    stocks,
    loading,
    error,
    fetchStockHistory,
    selectedSymbol,
    setSelectedSymbol,
    history,
    historyLoading,
    historyError,
  };
}
