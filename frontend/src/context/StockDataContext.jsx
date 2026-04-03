import { createContext, useContext, useState, useEffect } from 'react';
import { useStockData } from '../hooks/useStockData';

const StockDataContext = createContext();

const POLL_MS = 60_000; // 1 minute

export function StockDataProvider({ children }) {
  const stockData = useStockData(POLL_MS);

  // Countdown to next price refresh
  const [secondsLeft, setSecondsLeft] = useState(POLL_MS / 1000);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Reset countdown whenever stocks update
  useEffect(() => {
    if (stockData.stocks?.length) {
      setLastUpdated(Date.now());
      setSecondsLeft(POLL_MS / 1000);
    }
  }, [stockData.stocks]);

  // Tick countdown every second
  useEffect(() => {
    const id = setInterval(() => setSecondsLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <StockDataContext.Provider value={{ ...stockData, secondsLeft, lastUpdated, pollMs: POLL_MS }}>
      {children}
    </StockDataContext.Provider>
  );
}

export function useData() {
  return useContext(StockDataContext);
}
