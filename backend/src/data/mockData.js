// mockData.js — NSE Indian stocks (fallback when Yahoo Finance is unavailable)
// Prices are approximate — live values fetched via YahooFinanceService

const STOCKS = [
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries', price: 1280.00, change: 12.50, changePercent: 0.98,  sector: 'Energy',       volume: '8.2M',  risk: 'moderate' },
  { symbol: 'TCS.NS',      name: 'Tata Consultancy',    price: 3450.00, change: -22.0, changePercent: -0.63, sector: 'Technology',   volume: '3.1M',  risk: 'low'      },
  { symbol: 'INFY.NS',     name: 'Infosys Ltd.',        price: 1520.00, change: 18.70, changePercent: 1.24,  sector: 'Technology',   volume: '6.8M',  risk: 'low'      },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank',           price: 1740.00, change: -9.50, changePercent: -0.54, sector: 'Finance',      volume: '9.4M',  risk: 'low'      },
  { symbol: 'WIPRO.NS',    name: 'Wipro Ltd.',          price: 468.00,  change: 5.20,  changePercent: 1.12,  sector: 'Technology',   volume: '7.3M',  risk: 'moderate' },
  { symbol: 'ICICIBANK.NS',name: 'ICICI Bank',          price: 1185.00, change: 14.30, changePercent: 1.22,  sector: 'Finance',      volume: '12.1M', risk: 'moderate' },
  { symbol: 'SBIN.NS',     name: 'State Bank of India', price: 772.00,  change: -6.80, changePercent: -0.87, sector: 'Finance',      volume: '18.6M', risk: 'moderate' },
  { symbol: 'BAJFINANCE.NS',name:'Bajaj Finance',       price: 6850.00, change: 85.00, changePercent: 1.26,  sector: 'Finance',      volume: '1.2M',  risk: 'high'     },
  { symbol: 'TATAMOTORS.NS',name:'Tata Motors',         price: 690.00,  change: -11.2, changePercent: -1.60, sector: 'Automotive',   volume: '14.5M', risk: 'high'     },
  { symbol: 'HINDUNILVR.NS',name:'Hindustan Unilever',  price: 2320.00, change: 8.40,  changePercent: 0.36,  sector: 'FMCG',         volume: '2.8M',  risk: 'low'      },
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

function generateHourlyFallbackHistory(basePrice, days = 90, seedSymbol = 'NSE') {
  let seed = 0;
  for (let i = 0; i < seedSymbol.length; i++) seed = (seed * 31 + seedSymbol.charCodeAt(i)) >>> 0;
  const rand = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return (seed & 0xfffffff) / 0xfffffff;
  };
  const out = [];
  let price = Math.max(basePrice * (0.94 + rand() * 0.08), 1);
  const now = Date.now();
  const totalPoints = days * 24;
  for (let i = totalPoints; i >= 0; i--) {
    const d = new Date(now - i * 3600000); // minus 'i' hours
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekends
    
    const open   = price;
    const change = price * (rand() * 0.012 - 0.006); // smaller hourly changes
    price = Math.max(price + change, basePrice * 0.5);
    const high = Math.max(open, price) * (1 + rand() * 0.006);
    const low  = Math.min(open, price) * (1 - rand() * 0.006);
    const vol  = Math.floor(rand() * 1e6 + 2e5); // smaller volume per hour
    
    out.push({
      time: d.getTime(), // ms timestamp
      dateLabel: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit' }),
      price: Math.round(price * 100) / 100,
      open:  Math.round(open  * 100) / 100,
      high:  Math.round(high  * 100) / 100,
      low:   Math.round(low   * 100) / 100,
      volume: vol,
    });
  }
  return out;
}

const MOCK_LEADERBOARD = [
  { rank: 1, name: 'TradeMaster99', points: 8420, delta: +312, winRate: 72, badges: ['Market Guru', 'Risk Master'] },
  { rank: 2, name: 'BullRunKing',   points: 7815, delta: -180, winRate: 68, badges: ['First Profit'] },
  { rank: 3, name: 'AlphaHunter',   points: 7203, delta: +450, winRate: 65, badges: ['Risk Master'] },
  { rank: 4, name: 'QuantQueen',    points: 6540, delta: +210, winRate: 61, badges: ['Diversified'] },
  { rank: 5, name: 'You',           points: 500,  delta: 0,    winRate: 0,  badges: [], isCurrentUser: true },
];

const MOCK_NEWS = {
  'RELIANCE.NS': [
    { source: 'Economic Times', headline: 'Reliance Jio posts record subscriber growth in Q4', sentiment: 'positive' },
    { source: 'Business Standard', headline: 'Reliance Retail expands to 200 new cities',    sentiment: 'positive' },
    { source: 'Mint',             headline: 'Reliance faces SEBI scrutiny over related-party deals', sentiment: 'negative' },
  ],
  'TCS.NS': [
    { source: 'Economic Times', headline: 'TCS wins $500M deal with European banking giant',  sentiment: 'positive' },
    { source: 'Mint',           headline: 'TCS Q4 revenue beats estimates on strong demand',  sentiment: 'positive' },
    { source: 'Business Line',  headline: 'TCS sees muted growth in BFSI vertical',           sentiment: 'negative' },
  ],
  'INFY.NS': [
    { source: 'Mint',           headline: 'Infosys raises FY25 revenue guidance on deal wins', sentiment: 'positive' },
    { source: 'Economic Times', headline: 'Infosys to hire 30,000 freshers in FY26',           sentiment: 'positive' },
    { source: 'Reuters',        headline: 'Infosys faces margin pressure amid rising costs',    sentiment: 'negative' },
  ],
  'HDFCBANK.NS': [
    { source: 'Mint',             headline: 'HDFC Bank NIM improves after merger integration', sentiment: 'positive' },
    { source: 'Economic Times',   headline: 'HDFC Bank deposits grow 20% YoY in Q4',          sentiment: 'positive' },
    { source: 'Business Standard',headline: 'HDFC Bank loan growth slows amid liquidity concerns', sentiment: 'negative' },
  ],
  DEFAULT: [
    { source: 'Economic Times', headline: 'Nifty 50 hits record high on FII inflows',         sentiment: 'positive' },
    { source: 'Business Standard', headline: 'RBI holds repo rate steady amid inflation watch', sentiment: 'neutral' },
    { source: 'Mint',           headline: 'Indian IT sector outlook remains strong for FY26',  sentiment: 'positive' },
  ],
};

module.exports = { STOCKS, MOCK_LEADERBOARD, MOCK_NEWS, generateHistoricalData, generateHourlyFallbackHistory };
