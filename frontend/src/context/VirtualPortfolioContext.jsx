import { createContext, useCallback, useContext, useEffect, useReducer } from 'react';
import StorageService from '../api/StorageService';

const VirtualPortfolioContext = createContext(null);

const STARTING_CASH = 100_000; // V₹ 1,00,000

const INITIAL = {
  cash: STARTING_CASH,
  holdings: [],        // [{ symbol, shares, avgBuyPrice, totalInvested }]
  transactions: [],    // [{ id, type, symbol, shares, price, total, ts }]
  valueHistory: [],    // [{ ts, totalValue }] for sparkline
};

/* ── Helpers ─────────────────────────────────────────────────── */
function calcHoldingsValue(holdings, prices) {
  return holdings.reduce((sum, h) => {
    const p = prices[h.symbol] ?? h.avgBuyPrice;
    return sum + h.shares * p;
  }, 0);
}

/* ── Reducer ─────────────────────────────────────────────────── */
function reducer(state, action) {
  switch (action.type) {
    case 'BUY': {
      const { symbol, shares, price } = action.payload;
      const cost = shares * price;
      if (cost > state.cash) return state; // safety guard

      const existing = state.holdings.find(h => h.symbol === symbol);
      let holdings;
      if (existing) {
        const totalShares    = existing.shares + shares;
        const totalInvested  = existing.totalInvested + cost;
        holdings = state.holdings.map(h =>
          h.symbol === symbol
            ? { ...h, shares: totalShares, totalInvested, avgBuyPrice: totalInvested / totalShares }
            : h
        );
      } else {
        holdings = [...state.holdings, { symbol, shares, avgBuyPrice: price, totalInvested: cost }];
      }

      const tx = { id: Date.now(), type: 'BUY', symbol, shares, price, total: cost, ts: Date.now() };
      return {
        ...state,
        cash: +(state.cash - cost).toFixed(2),
        holdings,
        transactions: [tx, ...state.transactions.slice(0, 99)],
      };
    }

    case 'SELL': {
      const { symbol, shares, price } = action.payload;
      const holding = state.holdings.find(h => h.symbol === symbol);
      if (!holding || holding.shares < shares) return state; // safety guard

      const proceeds = shares * price;
      let holdings;
      if (holding.shares === shares) {
        holdings = state.holdings.filter(h => h.symbol !== symbol);
      } else {
        const remainingShares   = holding.shares - shares;
        const remainingInvested = holding.avgBuyPrice * remainingShares;
        holdings = state.holdings.map(h =>
          h.symbol === symbol
            ? { ...h, shares: remainingShares, totalInvested: remainingInvested }
            : h
        );
      }

      const tx = { id: Date.now(), type: 'SELL', symbol, shares, price, total: proceeds, ts: Date.now() };
      return {
        ...state,
        cash: +(state.cash + proceeds).toFixed(2),
        holdings,
        transactions: [tx, ...state.transactions.slice(0, 99)],
      };
    }

    case 'SNAPSHOT': {
      // Record a portfolio value snapshot for charting
      const entry = { ts: Date.now(), totalValue: action.payload };
      const valueHistory = [...state.valueHistory, entry].slice(-60);
      return { ...state, valueHistory };
    }

    case 'RESET':
      return INITIAL;

    default:
      return state;
  }
}

/* ── Provider ────────────────────────────────────────────────── */
export function VirtualPortfolioProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, () => {
    const saved = StorageService.get('virtualPortfolio', INITIAL);
    return { ...INITIAL, ...saved };
  });

  // Persist on every state change
  useEffect(() => {
    StorageService.set('virtualPortfolio', state);
  }, [state]);

  /* ── Actions ─────────────────────────────────────── */
  const buyStock  = useCallback((symbol, shares, price) =>
    dispatch({ type: 'BUY',  payload: { symbol, shares: +shares, price: +price } }), []);

  const sellStock = useCallback((symbol, shares, price) =>
    dispatch({ type: 'SELL', payload: { symbol, shares: +shares, price: +price } }), []);

  const recordSnapshot = useCallback((totalValue) =>
    dispatch({ type: 'SNAPSHOT', payload: totalValue }), []);

  const resetPortfolio = useCallback(() => dispatch({ type: 'RESET' }), []);

  /* ── Derived computations (need live prices to be passed in) ── */
  const getPortfolioStats = useCallback((livePrices = {}) => {
    const holdingsValue = calcHoldingsValue(state.holdings, livePrices);
    const totalValue    = +(state.cash + holdingsValue).toFixed(2);
    const totalInvested = state.holdings.reduce((s, h) => s + h.totalInvested, 0);
    const totalPnL      = +(holdingsValue - totalInvested).toFixed(2);
    const pnlPercent    = totalInvested > 0 ? +((totalPnL / totalInvested) * 100).toFixed(2) : 0;

    const holdingsWithLive = state.holdings.map(h => {
      const currentPrice = livePrices[h.symbol] ?? h.avgBuyPrice;
      const currentValue = +(h.shares * currentPrice).toFixed(2);
      const pnl          = +(currentValue - h.totalInvested).toFixed(2);
      const pnlPct       = h.totalInvested > 0 ? +((pnl / h.totalInvested) * 100).toFixed(2) : 0;
      return { ...h, currentPrice, currentValue, pnl, pnlPct };
    });

    return { totalValue, holdingsValue, totalInvested, totalPnL, pnlPercent, holdingsWithLive };
  }, [state.holdings, state.cash]);

  return (
    <VirtualPortfolioContext.Provider value={{
      cash: state.cash,
      holdings: state.holdings,
      transactions: state.transactions,
      valueHistory: state.valueHistory,
      startingCash: STARTING_CASH,
      buyStock,
      sellStock,
      recordSnapshot,
      resetPortfolio,
      getPortfolioStats,
    }}>
      {children}
    </VirtualPortfolioContext.Provider>
  );
}

export const useVirtualPortfolio = () => useContext(VirtualPortfolioContext);
