import { createContext, useCallback, useContext, useEffect, useReducer } from 'react';
import { computeHybridScore } from '../utils/engines/HybridSignalEngine';
import StorageService from '../api/StorageService';

const CrowdContext = createContext(null);

// ── Deterministic seed — same symbol always gives same score ──────────
function symbolSeed(symbol) {
  let h = 0;
  for (let i = 0; i < symbol.length; i++) h = (Math.imul(31, h) + symbol.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Returns a realistic AI sentiment (-1..+1) seeded by symbol */
function seedSentiment(symbol) {
  const s = symbolSeed(symbol);
  return ((s % 1000) / 1000) * 1.2 - 0.6; // range -0.6 .. +0.6
}

/** Returns realistic seed votes seeded by symbol */
function seedVotes(symbol) {
  const s = symbolSeed(symbol);
  const total    = 200 + (s % 800);               // 200–1000 total "crowd" votes
  const bullRatio = 0.3 + ((s % 400) / 1000);     // 30%–70% bullish
  return {
    bullish: Math.round(total * bullRatio),
    bearish: Math.round(total * (1 - bullRatio)),
  };
}

// Pre-seed all tracked symbols so no stock ever starts at 50/50
const SYMBOLS = ['AAPL', 'GOOGL', 'TSLA', 'AMZN', 'MSFT', 'NVDA', 'META', 'JPM'];

function buildSeededState() {
  const votes = {};
  const aiSentiment = {};
  for (const sym of SYMBOLS) {
    votes[sym]       = seedVotes(sym);
    aiSentiment[sym] = seedSentiment(sym);
  }
  return { votes, aiSentiment };
}

const SEEDED = buildSeededState();

const INITIAL = {
  votes:       SEEDED.votes,
  userVotes:   {},
  aiSentiment: SEEDED.aiSentiment,
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
  // Load persisted state but always merge seed scores for symbols with no votes yet
  const [state, dispatch] = useReducer(reducer, null, () => {
    const saved = StorageService.get('crowd', {});
    return {
      ...INITIAL,
      ...saved,
      votes:       { ...SEEDED.votes,       ...(saved.votes       || {}) },
      aiSentiment: { ...SEEDED.aiSentiment, ...(saved.aiSentiment || {}) },
      userVotes:   saved.userVotes || {},
    };
  });

  useEffect(() => { StorageService.set('crowd', state); }, [state]);

  const castVote     = useCallback((symbol, direction) => dispatch({ type: 'CAST_VOTE',       payload: { symbol, direction } }), []);
  const setSimMode   = useCallback(mode                => dispatch({ type: 'SET_SIM_MODE',    payload: mode }), []);
  const addChallenge = useCallback(challenge           => dispatch({ type: 'ADD_CHALLENGE',   payload: challenge }), []);
  const addContest   = useCallback(contest             => dispatch({ type: 'ADD_CONTEST',     payload: contest }), []);
  const joinContest  = useCallback(payload             => dispatch({ type: 'JOIN_CONTEST',    payload }), []);

  const getHybridScore = useCallback((symbol) => {
    const voteData    = state.votes[symbol]       || seedVotes(symbol);
    const aiSentiment = state.aiSentiment[symbol] ?? seedSentiment(symbol);
    return computeHybridScore(voteData, aiSentiment);
  }, [state.votes, state.aiSentiment]);

  return (
    <CrowdContext.Provider value={{ ...state, castVote, setSimMode, addChallenge, addContest, joinContest, getHybridScore }}>
      {children}
    </CrowdContext.Provider>
  );
}

export const useCrowd = () => useContext(CrowdContext);
