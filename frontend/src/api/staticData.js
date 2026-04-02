/**
 * staticData.js
 * Frontend-only static data used for UI rendering.
 * Does NOT contain any API keys or server logic.
 * All live data is fetched via apiClient.js from the Express backend.
 */

export const STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.',      price: 189.30, change: 2.15,  changePercent:  1.15, sector: 'Technology',    volume: '52.3M', risk: 'moderate' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.',  price: 175.48, change: -1.23, changePercent: -0.70, sector: 'Technology',    volume: '18.7M', risk: 'moderate' },
  { symbol: 'TSLA', name: 'Tesla Inc.',      price: 248.50, change: 5.67,  changePercent:  2.33, sector: 'Automotive',   volume: '112M',  risk: 'high'     },
  { symbol: 'AMZN', name: 'Amazon.com',      price: 198.20, change: -3.45, changePercent: -1.71, sector: 'E-Commerce',   volume: '34.2M', risk: 'moderate' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 415.80, change: 4.20,  changePercent:  1.02, sector: 'Technology',   volume: '20.5M', risk: 'low'      },
  { symbol: 'NVDA', name: 'NVIDIA Corp.',    price: 875.40, change: 15.30, changePercent:  1.78, sector: 'Semiconductors',volume: '48.6M', risk: 'high'     },
  { symbol: 'META', name: 'Meta Platforms',  price: 512.60, change: -8.90, changePercent: -1.71, sector: 'Social Media', volume: '15.3M', risk: 'moderate' },
  { symbol: 'JPM',  name: 'JPMorgan Chase',  price: 215.30, change: 1.85,  changePercent:  0.87, sector: 'Finance',      volume: '8.9M',  risk: 'low'      },
];

export const MOCK_LEADERBOARD = [
  { rank: 1, name: 'TradeMaster99', points: 8420, delta: +312, winRate: 72, badges: ['Market Guru', 'Risk Master'] },
  { rank: 2, name: 'BullRunKing',   points: 7815, delta: -180, winRate: 68, badges: ['First Profit'] },
  { rank: 3, name: 'AlphaHunter',   points: 7203, delta: +450, winRate: 65, badges: ['Risk Master'] },
  { rank: 4, name: 'QuantQueen',    points: 6540, delta: +210, winRate: 61, badges: ['Diversified'] },
  { rank: 5, name: 'You',           points: 500,  delta: 0,    winRate: 0,  badges: [], isCurrentUser: true },
];

export const LEARNING_MODULES = [
  { id: 'rsi',       title: 'Understanding RSI',   icon: '📊', difficulty: 'Beginner',     lessons: 5, xpReward: 50  },
  { id: 'ma',        title: 'Moving Averages',      icon: '📈', difficulty: 'Beginner',     lessons: 4, xpReward: 50  },
  { id: 'volume',    title: 'Volume Analysis',      icon: '📉', difficulty: 'Intermediate', lessons: 3, xpReward: 40  },
  { id: 'sentiment', title: 'Market Sentiment',     icon: '🧠', difficulty: 'Intermediate', lessons: 6, xpReward: 75  },
  { id: 'risk',      title: 'Risk Management',      icon: '🛡️', difficulty: 'Intermediate', lessons: 5, xpReward: 75  },
  { id: 'options',   title: 'Options Basics',       icon: '🎯', difficulty: 'Advanced',     lessons: 8, xpReward: 100 },
];

export const QUIZ_QUESTIONS = {
  rsi: [
    { q: 'What RSI level signals overbought conditions?', options: ['20', '50', '70', '90'], answer: 2 },
    { q: 'RSI below 30 typically indicates...', options: ['Overbought', 'Oversold', 'Neutral', 'Trending up'], answer: 1 },
    { q: 'RSI stands for...', options: ['Rate of Stock Index', 'Relative Strength Index', 'Risk-Scaled Indicator', 'Revenue Stability Index'], answer: 1 },
  ],
  ma: [
    { q: 'A Golden Cross occurs when...', options: ['50-day MA crosses above 200-day MA', 'Price drops below 50-day MA', 'Volume doubles', 'RSI hits 50'], answer: 0 },
    { q: 'EMA gives _____ weight to recent prices vs SMA.', options: ['Equal', 'Less', 'More', 'Random'], answer: 2 },
    { q: 'A Death Cross is a _____ signal.', options: ['Bullish', 'Neutral', 'Bearish', 'Confirming'], answer: 2 },
  ],
};
