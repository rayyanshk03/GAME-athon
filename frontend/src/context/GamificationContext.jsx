import { createContext, useCallback, useContext, useEffect, useReducer } from 'react';
import { checkBadgeUnlocks, checkDailyLogin, generateDailyQuests, getStreakBonus, updateQuestProgress } from '../engine/RewardsEngine';
import { getMaxStake, validateBet } from '../engine/OutcomeEngine';
import StorageService from '../services/StorageService';

const GamificationContext = createContext(null);

const INITIAL_STATE = {
  points:         500,
  lifetimePoints: 500,
  activeBets:     [],
  tradeHistory:   [],
  badges:         [],
  loginStreak:    0,
  lastLoginTs:    null,
  dailyQuests:    generateDailyQuests(),
  questDate:      new Date().toDateString(),
  riskProfile:    'balanced',
  winStreak:      0,
  stats: { totalWins: 0, totalTrades: 0, tripleWins: 0, uniqueStocks: new Set(), winStreak: 0 },
  notifications:  [],
};

function loadState() {
  const saved = StorageService.get('gamification');
  if (!saved) return INITIAL_STATE;
  return {
    ...INITIAL_STATE,
    ...saved,
    stats: { ...INITIAL_STATE.stats, ...saved.stats, uniqueStocks: new Set(saved.stats?.uniqueStocks || []) },
    dailyQuests: new Date().toDateString() !== saved.questDate ? generateDailyQuests() : saved.dailyQuests,
    questDate:   new Date().toDateString(),
  };
}

function reducer(state, action) {
  switch (action.type) {
    case 'PLACE_BET': {
      const bet = {
        ...action.payload,
        id: action.payload.id ?? Date.now(),
        placedAt: action.payload.placedAt ?? Date.now(),
      };
      return { ...state, points: state.points - bet.stake, activeBets: [...state.activeBets, bet] };
    }
    case 'RESOLVE_BET': {
      const { betId, pointDelta, won, symbol, multiplier } = action.payload;
      const bet = state.activeBets.find(b => b.id === betId);
      if (!bet) return state;
      const newPoints        = Math.max(0, state.points + pointDelta);
      const newLifetime      = state.lifetimePoints + Math.max(0, pointDelta);
      const newHistory       = [{ ...bet, pointDelta, won, resolvedAt: Date.now() }, ...state.tradeHistory.slice(0, 49)];
      const newStats         = {
        ...state.stats,
        totalWins:    state.stats.totalWins + (won ? 1 : 0),
        totalTrades:  state.stats.totalTrades + 1,
        tripleWins:   state.stats.tripleWins + (won && multiplier === 3 ? 1 : 0),
        uniqueStocks: new Set([...state.stats.uniqueStocks, symbol]),
        winStreak:    won ? state.stats.winStreak + 1 : 0,
        totalPoints:  newPoints,
        lifetimePoints: newLifetime,
        loginStreak:  state.loginStreak,
      };
      const newBadges    = checkBadgeUnlocks(newStats, state.badges.map(b => b.id));
      const quests       = updateQuestProgress(state.dailyQuests, 'trades');
      const quests2      = updateQuestProgress(won ? updateQuestProgress(quests, 'wins') : quests, won && pointDelta >= 50 ? 'single_earn' : '__', pointDelta);
      return {
        ...state,
        points: newPoints, lifetimePoints: newLifetime,
        activeBets: state.activeBets.filter(b => b.id !== betId),
        tradeHistory: newHistory, stats: newStats,
        badges: [...state.badges, ...newBadges],
        dailyQuests: quests2,
        notifications: newBadges.length ? [...newBadges.map(b => ({ type: 'badge', badge: b, id: Date.now() + Math.random() })), ...state.notifications] : state.notifications,
      };
    }
    case 'DAILY_LOGIN': {
      const { points, streakContinued } = action.payload;
      const streak = streakContinued ? state.loginStreak + 1 : 1;
      const bonus  = getStreakBonus(streak);
      return { ...state, points: state.points + points + bonus, loginStreak: streak, lastLoginTs: Date.now() };
    }
    case 'EARN_POINTS':
      return { ...state, points: state.points + action.payload, lifetimePoints: state.lifetimePoints + action.payload };
    case 'SET_RISK_PROFILE':
      return { ...state, riskProfile: action.payload };
    case 'DISMISS_NOTIFICATION':
      return { ...state, notifications: state.notifications.filter(n => n.id !== action.payload) };
    case 'COMPLETE_QUEST': {
      const quests = state.dailyQuests.map(q => q.id === action.payload ? { ...q, rewardClaimed: true } : q);
      const quest  = state.dailyQuests.find(q => q.id === action.payload);
      return { ...state, dailyQuests: quests, points: state.points + (quest?.reward || 0) };
    }
    default: return state;
  }
}

export function GamificationProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, loadState);

  // Persist to storage on every state change
  useEffect(() => {
    StorageService.set('gamification', {
      ...state,
      stats: { ...state.stats, uniqueStocks: [...state.stats.uniqueStocks] },
    });
  }, [state]);

  // Daily login check
  useEffect(() => {
    const result = checkDailyLogin(state.lastLoginTs);
    if (result.newLogin) dispatch({ type: 'DAILY_LOGIN', payload: result });
  }, []); // eslint-disable-line

  const placeBet       = useCallback((betData) => dispatch({ type: 'PLACE_BET', payload: betData }), []);
  const resolveBet     = useCallback((payload)  => dispatch({ type: 'RESOLVE_BET', payload }), []);
  const earnPoints     = useCallback((pts)       => dispatch({ type: 'EARN_POINTS', payload: pts }), []);
  const setRiskProfile = useCallback((p)         => dispatch({ type: 'SET_RISK_PROFILE', payload: p }), []);
  const dismissNotif   = useCallback((id)        => dispatch({ type: 'DISMISS_NOTIFICATION', payload: id }), []);
  const claimQuest     = useCallback((id)        => dispatch({ type: 'COMPLETE_QUEST', payload: id }), []);
  const getMaxStakeVal = useCallback(() => getMaxStake(state.points, state.riskProfile), [state.points, state.riskProfile]);
  const validate       = useCallback((stake)     => validateBet({ stake, points: state.points, maxStake: getMaxStakeVal() }), [state.points, getMaxStakeVal]);

  return (
    <GamificationContext.Provider value={{ ...state, placeBet, resolveBet, earnPoints, setRiskProfile, dismissNotif, claimQuest, getMaxStakeVal, validate }}>
      {children}
    </GamificationContext.Provider>
  );
}

export const useGamification = () => useContext(GamificationContext);
