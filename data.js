// ============================================================
//  MarketPulse — Mock Data  (data.js)
// ============================================================

// Utility: generate a realistic price walk
function priceWalk(start, count, volatility = 0.012, trend = 0) {
  const pts = [start];
  for (let i = 1; i < count; i++) {
    const change = pts[i - 1] * volatility * (Math.random() - 0.5 + trend);
    pts.push(Math.max(1, pts[i - 1] + change));
  }
  return pts.map(p => +p.toFixed(2));
}

// Intraday labels (9:30 → 4:00 EST, 78 points, ~5-min intervals)
function intradayLabels() {
  const labels = [];
  let h = 9, m = 30;
  while (h < 16 || (h === 16 && m === 0)) {
    labels.push(`${h}:${m.toString().padStart(2, '0')}`);
    m += 5;
    if (m >= 60) { m -= 60; h++; }
  }
  return labels;
}

const IDLabels = intradayLabels(); // 78 points

function weekLabels(n = 35) {
  const labels = []; const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    if (d.getDay() !== 0 && d.getDay() !== 6)
      labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  }
  return labels.slice(0, n);
}

function monthLabels(months) {
  const labels = []; const now = new Date();
  const days = months * 21;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    if (d.getDay() !== 0 && d.getDay() !== 6)
      labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  }
  return labels;
}

function yearLabels(years) {
  const labels = []; const now = new Date();
  for (let i = years * 12 - 1; i >= 0; i--) {
    const d = new Date(now); d.setMonth(d.getMonth() - i);
    labels.push(d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
  }
  return labels;
}

// All 15 stocks
window.STOCKS = [
  {
    ticker: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ',
    price: 213.45, change: 2.87, changePct: 1.36,
    open: 210.58, high: 215.20, low: 209.87,
    vol: '62.5M', pe: '28.4', mktCap: '$3.24T',
    w52h: '$237.49', w52l: '$164.08', avgVol: '62.5M',
    yield: '0.54%', beta: '1.24', eps: '$6.56',
    sparkline: priceWalk(210, 7, 0.01, 0.02)
  },
  {
    ticker: 'MSFT', name: 'Microsoft Corp.', exchange: 'NASDAQ',
    price: 415.20, change: -1.75, changePct: -0.42,
    open: 417.00, high: 418.50, low: 413.80,
    vol: '21.2M', pe: '34.1', mktCap: '$3.08T',
    w52h: '$468.35', w52l: '$309.45', avgVol: '20.8M',
    yield: '0.73%', beta: '0.91', eps: '$11.45',
    sparkline: priceWalk(417, 7, 0.008, -0.01)
  },
  {
    ticker: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ',
    price: 178.50, change: 1.58, changePct: 0.89,
    open: 176.92, high: 179.30, low: 176.40,
    vol: '18.7M', pe: '22.8', mktCap: '$2.19T',
    w52h: '$208.70', w52l: '$140.53', avgVol: '19.1M',
    yield: '—', beta: '1.05', eps: '$7.12',
    sparkline: priceWalk(176, 7, 0.009, 0.01)
  },
  {
    ticker: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ',
    price: 195.30, change: 2.20, changePct: 1.14,
    open: 193.10, high: 196.50, low: 192.80,
    vol: '30.4M', pe: '40.3', mktCap: '$2.04T',
    w52h: '$230.88', w52l: '$151.61', avgVol: '31.5M',
    yield: '—', beta: '1.18', eps: '$4.85',
    sparkline: priceWalk(193, 7, 0.011, 0.015)
  },
  {
    ticker: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ',
    price: 248.75, change: -5.88, changePct: -2.31,
    open: 254.63, high: 255.40, low: 247.20,
    vol: '91.2M', pe: '62.5', mktCap: '$796B',
    w52h: '$414.50', w52l: '$138.80', avgVol: '87.3M',
    yield: '—', beta: '2.31', eps: '$3.62',
    sparkline: priceWalk(255, 7, 0.02, -0.03)
  },
  {
    ticker: 'NVDA', name: 'NVIDIA Corp.', exchange: 'NASDAQ',
    price: 875.40, change: 27.25, changePct: 3.21,
    open: 848.15, high: 882.60, low: 845.30,
    vol: '42.8M', pe: '68.7', mktCap: '$2.15T',
    w52h: '$974.00', w52l: '$373.40', avgVol: '40.2M',
    yield: '0.03%', beta: '1.69', eps: '$11.93',
    sparkline: priceWalk(848, 7, 0.018, 0.04)
  },
  {
    ticker: 'META', name: 'Meta Platforms', exchange: 'NASDAQ',
    price: 585.20, change: 3.90, changePct: 0.67,
    open: 581.30, high: 589.50, low: 580.10,
    vol: '13.5M', pe: '26.4', mktCap: '$1.48T',
    w52h: '$638.40', w52l: '$391.56', avgVol: '14.1M',
    yield: '0.35%', beta: '1.28', eps: '$19.89',
    sparkline: priceWalk(581, 7, 0.009, 0.008)
  },
  {
    ticker: 'NFLX', name: 'Netflix Inc.', exchange: 'NASDAQ',
    price: 698.30, change: 9.98, changePct: 1.45,
    open: 688.32, high: 702.80, low: 687.40,
    vol: '4.1M', pe: '38.2', mktCap: '$300B',
    w52h: '$736.25', w52l: '$454.00', avgVol: '4.0M',
    yield: '—', beta: '1.35', eps: '$15.09',
    sparkline: priceWalk(688, 7, 0.012, 0.018)
  },
  {
    ticker: 'AMD', name: 'Advanced Micro Devices', exchange: 'NASDAQ',
    price: 142.80, change: -1.34, changePct: -0.93,
    open: 144.14, high: 145.30, low: 141.90,
    vol: '38.2M', pe: '45.8', mktCap: '$230B',
    w52h: '$227.30', w52l: '$113.35', avgVol: '37.9M',
    yield: '—', beta: '1.91', eps: '$2.65',
    sparkline: priceWalk(144, 7, 0.016, -0.012)
  },
  {
    ticker: 'INTC', name: 'Intel Corporation', exchange: 'NASDAQ',
    price: 20.15, change: -0.28, changePct: -1.37,
    open: 20.43, high: 20.61, low: 19.97,
    vol: '55.7M', pe: '—', mktCap: '$86B',
    w52h: '$51.28', w52l: '$17.67', avgVol: '52.4M',
    yield: '2.47%', beta: '1.02', eps: '-$1.61',
    sparkline: priceWalk(20.43, 7, 0.014, -0.018)
  },
  {
    ticker: 'BABA', name: 'Alibaba Group', exchange: 'NYSE',
    price: 82.30, change: -0.60, changePct: -0.72,
    open: 82.90, high: 83.45, low: 81.80,
    vol: '14.3M', pe: '15.2', mktCap: '$83B',
    w52h: '$117.82', w52l: '$66.63', avgVol: '13.8M',
    yield: '—', beta: '0.38', eps: '$5.83',
    sparkline: priceWalk(82.9, 7, 0.013, -0.009)
  },
  {
    ticker: 'JPM', name: 'JPMorgan Chase', exchange: 'NYSE',
    price: 238.50, change: 1.45, changePct: 0.61,
    open: 237.05, high: 239.80, low: 236.40,
    vol: '8.9M', pe: '13.2', mktCap: '$685B',
    w52h: '$263.16', w52l: '$183.08', avgVol: '9.1M',
    yield: '2.18%', beta: '1.12', eps: '$18.22',
    sparkline: priceWalk(237, 7, 0.007, 0.008)
  },
  {
    ticker: 'BAC', name: 'Bank of America', exchange: 'NYSE',
    price: 43.20, change: 0.32, changePct: 0.75,
    open: 42.88, high: 43.50, low: 42.70,
    vol: '42.1M', pe: '14.8', mktCap: '$334B',
    w52h: '$48.08', w52l: '$31.37', avgVol: '41.5M',
    yield: '2.59%', beta: '1.36', eps: '$3.21',
    sparkline: priceWalk(42.88, 7, 0.007, 0.01)
  },
  {
    ticker: 'V', name: 'Visa Inc.', exchange: 'NYSE',
    price: 315.70, change: -0.85, changePct: -0.27,
    open: 316.55, high: 317.40, low: 314.80,
    vol: '5.2M', pe: '30.1', mktCap: '$632B',
    w52h: '$354.67', w52l: '$252.95', avgVol: '5.5M',
    yield: '0.78%', beta: '0.92', eps: '$10.22',
    sparkline: priceWalk(316.55, 7, 0.006, -0.004)
  },
  {
    ticker: 'WMT', name: 'Walmart Inc.', exchange: 'NYSE',
    price: 96.80, change: 0.62, changePct: 0.64,
    open: 96.18, high: 97.20, low: 96.00,
    vol: '17.8M', pe: '37.5', mktCap: '$778B',
    w52h: '$105.62', w52l: '$72.68', avgVol: '18.2M',
    yield: '1.07%', beta: '0.54', eps: '$2.41',
    sparkline: priceWalk(96.18, 7, 0.006, 0.007)
  }
];

// Per-stock chart data for all time ranges
window.CHART_DATA = {};

window.STOCKS.forEach(s => {
  const base = s.price;
  const posNeg = s.changePct >= 0 ? 1 : -1;

  window.CHART_DATA[s.ticker] = {
    '1D':  { labels: IDLabels,             data: priceWalk(base * 0.986, IDLabels.length, 0.003, posNeg * 0.0004) },
    '1W':  { labels: weekLabels(5),        data: priceWalk(base * 0.975, 5, 0.012, posNeg * 0.003) },
    '1M':  { labels: monthLabels(1),       data: priceWalk(base * 0.92,  monthLabels(1).length, 0.010, posNeg * 0.002) },
    '3M':  { labels: monthLabels(3),       data: priceWalk(base * 0.82,  monthLabels(3).length, 0.011, posNeg * 0.0015) },
    '6M':  { labels: monthLabels(6),       data: priceWalk(base * 0.72,  monthLabels(6).length, 0.010, posNeg * 0.0013) },
    'YTD': { labels: monthLabels(3),       data: priceWalk(base * 0.85,  monthLabels(3).length, 0.010, posNeg * 0.0018) },
    '1Y':  { labels: yearLabels(1),        data: priceWalk(base * 0.60,  12, 0.040, posNeg * 0.008) },
    '2Y':  { labels: yearLabels(2),        data: priceWalk(base * 0.45,  24, 0.038, posNeg * 0.007) },
    '5Y':  { labels: yearLabels(5),        data: priceWalk(base * 0.22,  60, 0.060, posNeg * 0.010) },
    '10Y': { labels: yearLabels(10),       data: priceWalk(base * 0.10, 120, 0.065, posNeg * 0.008) },
    'ALL': { labels: yearLabels(15),       data: priceWalk(base * 0.04, 180, 0.070, posNeg * 0.009) }
  };
});

// News data per stock
window.NEWS = {
  AAPL: [
    { source: 'Bloomberg', headline: 'Apple Vision Pro secures enterprise partnerships, driving Q2 revenue surge', excerpt: 'Corporate adoption of spatial computing accelerating faster than analysts projected...', time: '1h ago', sentiment: 'bullish' },
    { source: 'CNBC', headline: 'iPhone 16 Pro demand remains strong in India and Southeast Asia markets', excerpt: 'Emerging market sales picking up slack from slower North American demand...', time: '3h ago', sentiment: 'bullish' },
    { source: 'Reuters', headline: 'Apple faces EU antitrust investigation over App Store fee structures', excerpt: 'Regulators in Brussels launch formal inquiry into Apple\'s commission policies...', time: '6h ago', sentiment: 'bearish' },
    { source: 'MarketWatch', headline: 'Analysts raise AAPL price targets following strong services revenue report', excerpt: 'Services division now accounts for over 22% of total revenue for the quarter...', time: '1d ago', sentiment: 'bullish' },
    { source: 'FT', headline: 'Apple\'s AI features drive upgrade cycle to fastest pace in five years', excerpt: 'Apple Intelligence integration boosting upgrade rates globally...', time: '1d ago', sentiment: 'bullish' },
    { source: 'The Verge', headline: 'Apple\'s M4 chip performance leads benchmarks across all categories', excerpt: 'New silicon architecture shows dramatic improvements in ML inference workloads...', time: '2d ago', sentiment: 'neutral' }
  ],
  MSFT: [
    { source: 'Bloomberg', headline: 'Microsoft Azure cloud revenue grows 31% YoY, beating expectations', excerpt: 'Enterprise AI workloads driving record cloud infrastructure demand globally...', time: '2h ago', sentiment: 'bullish' },
    { source: 'CNBC', headline: 'Copilot AI adoption reaches 300 million monthly active enterprise users', excerpt: 'Microsoft\'s AI assistant integration across Office suite gaining traction...', time: '4h ago', sentiment: 'bullish' },
    { source: 'WSJ', headline: 'Microsoft gaming division misses targets amid console market slowdown', excerpt: 'Xbox hardware sales decline weighed on overall gaming segment performance...', time: '7h ago', sentiment: 'bearish' },
    { source: 'TechCrunch', headline: 'Microsoft OpenAI partnership renewed with expanded $15B commitment', excerpt: 'New agreement ensures continued exclusive cloud access for OpenAI workloads...', time: '1d ago', sentiment: 'bullish' },
    { source: 'Reuters', headline: 'DOJ reviewing Microsoft\'s cloud bundling practices for antitrust concerns', excerpt: 'Investigation focuses on Teams and Azure bundling agreements with enterprises...', time: '1d ago', sentiment: 'bearish' },
    { source: 'FT', headline: 'Satya Nadella reaffirms AI-first strategy at annual developer conference', excerpt: 'CEO outlines five-year roadmap for integrating AI across all product lines...', time: '2d ago', sentiment: 'neutral' }
  ],
  TSLA: [
    { source: 'Reuters', headline: 'Tesla Q1 deliveries fall 13% as European sales collapse amid protests', excerpt: 'Brand association with Elon Musk\'s political activities continuing to weigh on sales...', time: '1h ago', sentiment: 'bearish' },
    { source: 'Bloomberg', headline: 'Tesla Cybertruck recall announced for accelerator pedal malfunction', excerpt: 'Third recall for Cybertruck platform in 12 months raises manufacturing concerns...', time: '3h ago', sentiment: 'bearish' },
    { source: 'CNBC', headline: 'Tesla FSD 13.5 achieves 99.7% intervention-free mile record in beta testing', excerpt: 'Autonomous driving capabilities showing significant improvement in urban environments...', time: '5h ago', sentiment: 'bullish' },
    { source: 'WSJ', headline: 'Tesla Energy storage business hits record quarterly revenue of $2.8B', excerpt: 'Megapack orders booked through 2026, providing stable revenue visibility...', time: '1d ago', sentiment: 'bullish' },
    { source: 'FT', headline: 'Model 2 compact EV confirmed for H2 2025 production start in Mexico', excerpt: 'Affordable $25,000 vehicle expected to open new market segments for Tesla...', time: '1d ago', sentiment: 'bullish' },
    { source: 'Electrek', headline: 'Analyst downgrades TSLA to sell citing Musk distraction premium discount', excerpt: 'Multiple sell-side analysts revising target prices downward for 2025...', time: '2d ago', sentiment: 'bearish' }
  ],
  NVDA: [
    { source: 'Bloomberg', headline: 'NVIDIA H200 GPU backlog extends to 18 months as AI demand accelerates', excerpt: 'Hyperscalers placing orders far beyond current production capacity...', time: '30m ago', sentiment: 'bullish' },
    { source: 'CNBC', headline: 'NVIDIA announces Blackwell Ultra architecture with 4x H100 performance', excerpt: 'New chips promise dramatic improvements in large language model training...', time: '2h ago', sentiment: 'bullish' },
    { source: 'Reuters', headline: 'US expands chip export restrictions, NVIDIA revises China revenue guidance', excerpt: 'Regulatory uncertainty continues to cloud long-term outlook for data center exports...', time: '5h ago', sentiment: 'bearish' },
    { source: 'WSJ', headline: 'NVIDIA CUDA ecosystem moat strengthens as competitors struggle to catch up', excerpt: 'Software lock-in providing durable competitive advantage in AI infrastructure...', time: '1d ago', sentiment: 'bullish' },
    { source: 'FT', headline: 'Jensen Huang: AI demand is "not a bubble" as enterprise adoption accelerates', excerpt: 'CEO dismisses valuation concerns, citing fundamental shift in computing paradigm...', time: '1d ago', sentiment: 'neutral' },
    { source: 'TechCrunch', headline: 'NVIDIA DGX Cloud partners with 200 new enterprise customers in Q1', excerpt: 'Cloud AI training service gaining significant traction with Fortune 500 companies...', time: '2d ago', sentiment: 'bullish' }
  ]
};

// Default news for unlisted stocks
['GOOGL','AMZN','META','NFLX','AMD','INTC','BABA','JPM','BAC','V','WMT'].forEach(t => {
  window.NEWS[t] = [
    { source: 'Bloomberg', headline: `${t} reports strong quarterly earnings, beating analyst estimates`, excerpt: 'Revenue and margin improvements across key business segments...', time: '2h ago', sentiment: 'bullish' },
    { source: 'Reuters', headline: `${t} announces strategic partnership to accelerate AI integration`, excerpt: 'New deal expected to add significant competitive advantages in core markets...', time: '5h ago', sentiment: 'bullish' },
    { source: 'CNBC', headline: `Wall Street mixed on ${t} outlook following management comments`, excerpt: 'Analysts split on near-term trajectory despite solid fundamental metrics...', time: '8h ago', sentiment: 'neutral' },
    { source: 'WSJ', headline: `${t} faces regulatory scrutiny in European markets over data practices`, excerpt: 'EU regulators examining compliance with digital markets act provisions...', time: '1d ago', sentiment: 'bearish' },
    { source: 'MarketWatch', headline: `${t} raises guidance for FY2025, citing strong demand trends`, excerpt: 'Management confident in growth trajectory despite macroeconomic headwinds...', time: '1d ago', sentiment: 'bullish' },
    { source: 'FT', headline: `${t} share buyback program totaling $10B approved by board`, excerpt: 'Capital return strategy signals management confidence in long-term outlook...', time: '2d ago', sentiment: 'neutral' }
  ];
});
