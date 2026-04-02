import { createContext, useContext } from 'react';
import { useStockData } from '../hooks/useStockData';

const StockDataContext = createContext();

export function StockDataProvider({ children }) {
  const stockData = useStockData(60000); // poll every 60s

  return (
    <StockDataContext.Provider value={stockData}>
      {children}
    </StockDataContext.Provider>
  );
}

export function useData() {
  return useContext(StockDataContext);
}
