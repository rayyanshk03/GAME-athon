import { createContext, useCallback, useContext, useEffect, useReducer } from 'react';
import { computeHybridScore } from '../utils/engines/HybridSignalEngine';
import StorageService from '../api/StorageService';

const CrowdContext = createContext(null);

const INITIAL = {
  votes:       {},           // { SYMBOL: { bullish: 0, bearish: 0 } }
  userVotes:   {},           // { SYMBOL: 'bullish'|'bearish' }
  aiSentiment: {},           // { SYMBOL: number -1..+1 }
  simMode:     'pro',
  challenges:  [],
  contests:    [],
};

function reducer(state, action) {
  switch (action.type) {
    case 'CAST_VOTE': {
      const { symbol, direction } = action.payload;
      if (state.userVotes[symbol]) return state; // already voted
      const prev = state.votes[symbol] || { bullish: 0, bearish: 0 };
      return {
        ...state,
        votes:     { ...state.votes,     [symbol]: { ...prev, [direction]: prev[direction] + 1 } },
        userVotes: { ...state.userVotes, [symbol]: direction },
      };
    }
    case 'SET_AI_SENTIMENT':
      return { ...state, aiSentiment: { ...state.aiSentiment, [action.payload.symbol]: action.payload.value } };
    case 'SET_SIM_MODE':
      return { ...state, simMode: action.payload };
    case 'ADD_CHALLENGE':
      return { ...state, challenges: [{ ...action.payload, id: Date.now(), startedAt: Date.now() }, ...state.challenges] };
    case 'ADD_CONTEST':
      return { ...state, contests: [{ ...action.payload, id: Date.now(), startedAt: Date.now(), participants: [] }, ...state.contests] };
    case 'JOIN_CONTEST': {
      const contests = state.contests.map(c =>
        c.id === action.payload.contestId
          ? { ...c, participants: [...c.participants, action.payload] }
          : c
      );
      return { ...state, contests };
    }
    default: return state;
  }
}

export function CrowdIntelligenceProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, () => ({ ...INITIAL, ...StorageService.get('crowd', INITIAL) }));

  useEffect(() => { StorageService.set('crowd', state); }, [state]);

  const castVote     = useCallback((symbol, direction) => dispatch({ type: 'CAST_VOTE',       payload: { symbol, direction } }), []);
  const setSimMode   = useCallback(mode                => dispatch({ type: 'SET_SIM_MODE',    payload: mode }), []);
  const addChallenge = useCallback(challenge           => dispatch({ type: 'ADD_CHALLENGE',   payload: challenge }), []);
  const addContest   = useCallback(contest             => dispatch({ type: 'ADD_CONTEST',     payload: contest }), []);
  const joinContest  = useCallback(payload             => dispatch({ type: 'JOIN_CONTEST',    payload }), []);

  const getHybridScore = useCallback((symbol) => {
    const voteData     = state.votes[symbol] || { bullish: 0, bearish: 0 };
    const aiSentiment  = state.aiSentiment[symbol] || 0;
    return computeHybridScore(voteData, aiSentiment);
  }, [state.votes, state.aiSentiment]);

  return (
    <CrowdContext.Provider value={{ ...state, castVote, setSimMode, addChallenge, addContest, joinContest, getHybridScore }}>
      {children}
    </CrowdContext.Provider>
  );
}

export const useCrowd = () => useContext(CrowdContext);
