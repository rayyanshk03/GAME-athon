import { createContext, useCallback, useContext, useEffect, useReducer } from 'react';
import StorageService from '../services/StorageService';

const PortfolioContext = createContext(null);

const INITIAL = { tradeHistory: [], pnlHistory: [], friends: [], leagues: [] };

function calcStats(history) {
  if (!history.length) return { totalPnL: 0, winRate: 0, bestTrade: null, worstTrade: null, bestSector: null, avgMultiplier: 1, reputationScore: 0 };
  const wins     = history.filter(t => t.won);
  const totalPnL = history.reduce((s, t) => s + t.pointDelta, 0);
  const sorted   = [...history].sort((a, b) => b.pointDelta - a.pointDelta);
  const sectors  = history.reduce((m, t) => { m[t.sector] = (m[t.sector] || 0) + (t.won ? 1 : -1); return m; }, {});
  const bestSector  = Object.entries(sectors).sort((a, b) => b[1] - a[1])[0]?.[0];
  const worstSector = Object.entries(sectors).sort((a, b) => a[1] - b[1])[0]?.[0];
  const winRate     = Math.round((wins.length / history.length) * 100);
  const avgMul      = Math.round((history.reduce((s, t) => s + (t.multiplier || 1), 0) / history.length) * 10) / 10;
  const repScore    = Math.min(100, Math.round(winRate * 0.5 + Math.min(history.length, 50) * 0.5 + (winRate > 60 ? 10 : 0)));
  return { totalPnL, winRate, bestTrade: sorted[0], worstTrade: sorted[sorted.length - 1], bestSector, worstSector, avgMultiplier: avgMul, reputationScore: repScore };
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_TRADE': {
      const history = [action.payload, ...state.tradeHistory.slice(0, 99)];
      const pnl     = [...state.pnlHistory, { ts: Date.now(), cumPnL: history.reduce((s, t) => s + t.pointDelta, 0) }].slice(-50);
      return { ...state, tradeHistory: history, pnlHistory: pnl };
    }
    case 'ADD_FRIEND':    return { ...state, friends: [...state.friends, action.payload] };
    case 'CREATE_LEAGUE': return { ...state, leagues: [...state.leagues, { ...action.payload, id: Date.now(), members: [] }] };
    default: return state;
  }
}

export function PortfolioProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, () => ({ ...INITIAL, ...StorageService.get('portfolio', INITIAL) }));

  useEffect(() => { StorageService.set('portfolio', state); }, [state]);

  const addTrade     = useCallback(trade  => dispatch({ type: 'ADD_TRADE',    payload: trade }), []);
  const addFriend    = useCallback(friend => dispatch({ type: 'ADD_FRIEND',   payload: friend }), []);
  const createLeague = useCallback(league => dispatch({ type: 'CREATE_LEAGUE',payload: league }), []);
  const stats        = calcStats(state.tradeHistory);

  return (
    <PortfolioContext.Provider value={{ ...state, ...stats, addTrade, addFriend, createLeague }}>
      {children}
    </PortfolioContext.Provider>
  );
}

export const usePortfolio = () => useContext(PortfolioContext);
