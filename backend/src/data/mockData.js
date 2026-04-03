// mockData.js — Backend data source
// Live data: replace with real API calls (Alpha Vantage, Polygon.io, etc.)

const STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.',      price: 189.30, change: 2.15,  changePercent:  1.15, sector: 'Technology',    volume: '52.3M', risk: 'moderate' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.',  price: 175.48, change: -1.23, changePercent: -0.70, sector: 'Technology',    volume: '18.7M', risk: 'moderate' },
  { symbol: 'TSLA', name: 'Tesla Inc.',      price: 248.50, change: 5.67,  changePercent:  2.33, sector: 'Automotive',   volume: '112M',  risk: 'high'     },
  { symbol: 'AMZN', name: 'Amazon.com',      price: 198.20, change: -3.45, changePercent: -1.71, sector: 'E-Commerce',   volume: '34.2M', risk: 'moderate' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 415.80, change: 4.20,  changePercent:  1.02, sector: 'Technology',   volume: '20.5M', risk: 'low'      },
  { symbol: 'NVDA', name: 'NVIDIA Corp.',    price: 875.40, change: 15.30, changePercent:  1.78, sector: 'Semiconductors',volume: '48.6M', risk: 'high'     },
  { symbol: 'META', name: 'Meta Platforms',  price: 512.60, change: -8.90, changePercent: -1.71, sector: 'Social Media', volume: '15.3M', risk: 'moderate' },
  { symbol: 'JPM',  name: 'JPMorgan Chase',  price: 215.30, change: 1.85,  changePercent:  0.87, sector: 'Finance',      volume: '8.9M',  risk: 'low'      },
];

function generateHistoricalData(basePrice, volatility = 0.02, days = 7) {
  const data = [];
  let price = basePrice * (0.94 + Math.random() * 0.12);
  const now = Date.now();
  const totalPoints = days * 24;
  for (let i = totalPoints; i >= 0; i--) {
    const change = price * (Math.random() * volatility * 2 - volatility);
    price = Math.max(price + change, basePrice * 0.5);
    data.push({ time: now - i * 3600000, price: Math.round(price * 100) / 100, volume: Math.floor(Math.random() * 5e6 + 1e6) });
  }
  return data;
}

function generateDailyFallbackHistory(basePrice, days = 90, seedSymbol = 'SPY') {
  let seed = 0;
  for (let i = 0; i < seedSymbol.length; i++) seed = (seed * 31 + seedSymbol.charCodeAt(i)) >>> 0;
  const rand = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return (seed & 0xfffffff) / 0xfffffff;
  };
  const out = [];
  let price = Math.max(basePrice * (0.94 + rand() * 0.08), 1);
  const now = Date.now();
  for (let i = days; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    const open = price;
    const change = price * (rand() * 0.04 - 0.02);
    price = Math.max(price + change, basePrice * 0.5);
    const high = Math.max(open, price) * (1 + rand() * 0.012);
    const low = Math.min(open, price) * (1 - rand() * 0.012);
    const vol = Math.floor(rand() * 4e6 + 8e5);
    out.push({
      time: d.getTime(),
      dateLabel: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: Math.round(price * 100) / 100,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      volume: vol,
    });
  }
  return out;
}

const MOCK_LEADERBOARD = [
  { rank: 1, name: 'TradeMaster99', points: 8420, delta: +312, winRate: 72, badges: ['Market Guru', 'Risk Master'] },
  { rank: 2, name: 'BullRunKing', points: 7815, delta: -180, winRate: 68, badges: ['First Profit'] },
  { rank: 3, name: 'AlphaHunter', points: 7203, delta: +450, winRate: 65, badges: ['Risk Master'] },
  { rank: 4, name: 'QuantQueen', points: 6540, delta: +210, winRate: 61, badges: ['Diversified'] },
  { rank: 5, name: 'You', points: 500, delta: 0, winRate: 0, badges: [], isCurrentUser: true },
];

const MOCK_NEWS = {
  AAPL: [
    { source: 'Reuters', headline: 'Apple posts record iPhone sales in emerging markets', sentiment: 'positive' },
    { source: 'Bloomberg', headline: 'Apple Vision Pro demand exceeds expectations', sentiment: 'positive' },
    { source: 'CNBC', headline: 'Apple faces antitrust scrutiny in the EU', sentiment: 'negative' },
  ],
  TSLA: [
    { source: 'Reuters', headline: 'Tesla EV demand softens amid price war', sentiment: 'negative' },
    { source: 'Bloomberg', headline: 'Tesla Cybertruck deliveries surge in Q4', sentiment: 'positive' },
    { source: 'MarketWatch', headline: 'Tesla autopilot faces fresh regulatory inquiry', sentiment: 'negative' },
  ],
  NVDA: [
    { source: 'WSJ', headline: 'NVIDIA AI chip demand continues to surge globally', sentiment: 'positive' },
    { source: 'Bloomberg', headline: 'NVIDIA posts record data center revenue', sentiment: 'positive' },
    { source: 'CNBC', headline: 'NVIDIA supply constraints ease heading into Q2', sentiment: 'positive' },
  ],
  DEFAULT: [
    { source: 'Reuters', headline: 'Markets eye Fed minutes for rate cut signals', sentiment: 'neutral' },
    { source: 'Bloomberg', headline: 'Tech sector rallies on strong earnings outlook', sentiment: 'positive' },
    { source: 'MarketWatch', headline: 'Bond yields stabilise as inflation data softens', sentiment: 'positive' },
  ],
};

module.exports = { STOCKS, MOCK_LEADERBOARD, MOCK_NEWS, generateHistoricalData, generateDailyFallbackHistory };
