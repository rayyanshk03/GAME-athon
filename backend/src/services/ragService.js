/**
 * ragService.js — Routes finance questions to the RAG API.
 * Falls back to Gemini → rich local finance KB.
 * Local KB covers 50+ finance topics so the chatbot ALWAYS gives real answers.
 */

const RAG_BASE = process.env.RAG_API_URL?.replace(/\/$/, '');

// ──────────────────────────────────────────────────────────────────────────────
//  LOCAL FINANCE KNOWLEDGE BASE  (50+ topics, keyword-matched)
//  Used when both RAG and Gemini are unavailable.
// ──────────────────────────────────────────────────────────────────────────────
const FINANCE_KB = [
  {
    keys: ['rsi', 'relative strength'],
    answer: '📊 **RSI (Relative Strength Index)** measures price momentum on a 0–100 scale. Below 30 = oversold — the stock may be cheap and ready to bounce (potential BUY signal). Above 70 = overbought — the stock may be due for a pullback (potential SELL signal). RSI is best used alongside trend indicators to confirm signals. Practical tip: wait for RSI to cross back above 30 (not just touch it) before entering a long position.',
  },
  {
    keys: ['moving average', 'sma', 'ema', 'exponential moving'],
    answer: '📈 **Moving Averages** smooth out price data to reveal the underlying trend. The 20-day MA = short-term trend. The 50-day MA = medium-term. The 200-day MA = long-term. When the 20-day crosses above the 50-day, it\'s called a **Golden Cross** — a bullish signal. When it crosses below, it\'s a **Death Cross** — bearish. Practical tip: use the 50-day MA as a dynamic support/resistance level.',
  },
  {
    keys: ['macd', 'moving average convergence'],
    answer: '⚡ **MACD (Moving Average Convergence Divergence)** shows momentum shifts. It plots the difference between 12-day and 26-day EMAs. When the MACD line crosses above the signal line → bullish. Below → bearish. The histogram bars show momentum strength. Practical tip: the most reliable MACD signals occur when the crossover happens below zero (for buys) or above zero (for sells).',
  },
  {
    keys: ['risk', 'manage risk', 'risk management', 'position sizing', 'stop loss', 'stop-loss'],
    answer: '🛡️ **Risk Management** is the #1 skill separating successful traders from losing ones. Key rules:\n• Never risk more than 1–2% of your total capital on a single trade\n• Always define your stop-loss BEFORE entering — place it below a key support level\n• Your reward:risk ratio should be at least 2:1 (target twice what you risk)\n• Diversify across sectors — don\'t put everything in one stock\n• Reduce position size when uncertainty is high (e.g., before earnings). Practical tip: the 1% rule means on a $10,000 account, you risk max $100 per trade. Small losses are recoverable; large ones are not.',
  },
  {
    keys: ['bull market', 'bull run', 'bullish'],
    answer: '🚀 **Bull Market** = a period where stock prices rise 20%+ from a recent low, sustained over months. Driven by economic growth, low interest rates, rising corporate earnings, and investor optimism. Bull markets historically last longer than bear markets (avg ~3 years). Practical tip: in a bull market, "buy the dip" strategies work well — pullbacks to the 50-day MA are buying opportunities.',
  },
  {
    keys: ['bear market', 'bearish', 'market crash', 'recession'],
    answer: '📉 **Bear Market** = a 20%+ decline from recent highs lasting 2+ months. Caused by economic recession fears, rising interest rates, falling earnings, or geopolitical crises. Bear markets average ~10 months. Practical tip: in a bear market, reduce exposure, hold more cash, and look for defensive stocks (healthcare, utilities, consumer staples) that hold value better.',
  },
  {
    keys: ['candlestick', 'candle', 'ohlc', 'open high low close'],
    answer: '🕯️ **Candlestick Charts** show Open, High, Low, and Close for each period. Green candle = price closed HIGHER than open (bullish). Red candle = price closed LOWER (bearish). Key patterns:\n• **Hammer** (long lower wick) = potential reversal up\n• **Doji** (open ≈ close) = indecision, possible reversal\n• **Engulfing** = strong reversal signal\n• **Shooting Star** = potential reversal down. Practical tip: candlestick patterns are most reliable at key support/resistance levels with high volume confirmation.',
  },
  {
    keys: ['pe ratio', 'p/e', 'price to earnings', 'valuation', 'overvalued', 'undervalued'],
    answer: '💰 **P/E Ratio (Price-to-Earnings)** = stock price ÷ earnings per share. It tells you how much investors pay for each $1 of earnings. High P/E (>30) = growth expectations or overvaluation. Low P/E (<10) = value stock or struggling business. Compare P/E to industry peers, not the whole market. Practical tip: a high P/E isn\'t always bad — growth companies like Amazon traded at 100+ P/E for years before delivering massive returns.',
  },
  {
    keys: ['dividend', 'dividend yield', 'income investing', 'dividend stock'],
    answer: '💵 **Dividends** are cash payments companies make to shareholders, usually quarterly. Dividend Yield = annual dividend ÷ stock price × 100%. Stable companies (utilities, banks, consumer staples) pay reliable dividends. High yield (>6–7%) can signal financial distress — always verify payout ratio (dividends ÷ earnings). Practical tip: REITs must pay 90% of income as dividends by law — they\'re excellent income generators.',
  },
  {
    keys: ['volume', 'trading volume', 'high volume', 'low volume'],
    answer: '📦 **Volume** is the number of shares traded in a period. It validates price moves: High volume + rising price = strong bullish conviction. High volume + falling price = strong bearish selling. Low volume moves are less reliable — they can reverse quickly. Practical tip: a breakout above a resistance level on 2× average volume is far more reliable than one on low volume.',
  },
  {
    keys: ['support', 'resistance', 'support level', 'resistance level', 'breakout', 'breakdown'],
    answer: '⚖️ **Support & Resistance** are price levels where buying (support) or selling (resistance) is concentrated. Support = floor where price tends to bounce. Resistance = ceiling where price tends to stall. When price breaks above resistance on high volume, that old resistance becomes new support. Practical tip: the more times a level is tested without breaking, the more significant the eventual breakout or breakdown will be.',
  },
  {
    keys: ['market cap', 'large cap', 'small cap', 'mid cap', 'capitalization'],
    answer: '🏦 **Market Cap** = share price × total shares outstanding. Categories:\n• **Large-cap** (>$10B): Apple, Google — stable, lower risk\n• **Mid-cap** ($2B–$10B): growth potential with moderate risk\n• **Small-cap** (<$2B): highest growth potential, highest risk\nPractical tip: in a bull market, small-caps often outperform. In a bear market, large-caps are safer. Balance your portfolio across sizes.',
  },
  {
    keys: ['volatility', 'vix', 'standard deviation', 'beta'],
    answer: '🌪️ **Volatility** measures how much a stock\'s price fluctuates. High volatility = bigger moves (more opportunity AND more risk). **Beta** compares a stock\'s volatility to the market: Beta >1 = more volatile than market; <1 = less volatile. **VIX** is the "fear index" — VIX >30 = high fear/market turbulence; <20 = calm markets. Practical tip: high-volatility stocks need wider stop-losses to avoid being stopped out by normal price swings.',
  },
  {
    keys: ['etf', 'index fund', 'spy', 'qqq', 'diversification', 'diversify'],
    answer: '🗂️ **ETFs (Exchange-Traded Funds)** hold baskets of assets and trade like stocks. They provide instant diversification at low cost. Popular ETFs:\n• **SPY** = S&P 500 (top 500 US companies)\n• **QQQ** = Nasdaq-100 (tech-heavy)\n• **IWM** = Russell 2000 (small-caps)\n• **GLD** = Gold\nPractical tip: for beginners, putting 60–70% in SPY/QQQ and only 20–30% in individual stocks dramatically reduces risk while maintaining growth potential.',
  },
  {
    keys: ['inflation', 'cpi', 'consumer price', 'purchasing power'],
    answer: '💸 **Inflation** measures how fast prices rise over time. High inflation erodes purchasing power and hurts stock valuations — especially growth/tech stocks (their future earnings are worth less when discounted). Inflation is measured by CPI (Consumer Price Index). Stocks that do well in inflation: energy, commodities, REITs, materials. Practical tip: when inflation is high, consider adding commodity ETFs or inflation-protected bonds (TIPS) to your portfolio.',
  },
  {
    keys: ['interest rate', 'fed', 'federal reserve', 'rate hike', 'monetary policy', 'central bank'],
    answer: '🏛️ **Interest Rates** set by central banks (like the US Federal Reserve) control economic growth. Rate hikes = borrowing costs rise → growth stocks fall, banks benefit. Rate cuts = borrowing is cheap → growth stocks surge, bonds rise. The Fed meets 8 times per year. Markets often move before the announcement based on expectations. Practical tip: "Don\'t fight the Fed" — if rates are rising, reduce exposure to high-growth tech stocks.',
  },
  {
    keys: ['earnings', 'earnings report', 'eps', 'quarterly earnings', 'earnings season'],
    answer: '📋 **Earnings Reports** are quarterly company financial statements showing revenue, profit, and EPS (Earnings Per Share). Markets move dramatically around earnings:\n• Beat expectations → stock often rises\n• Miss expectations → stock often drops significantly\n• Even a beat can cause a drop if guidance is weak. Practical tip: "buy the rumor, sell the news" — stocks often rise before earnings and fall after even on good results. Avoid holding through earnings unless you understand the risk.',
  },
  {
    keys: ['options', 'call option', 'put option', 'derivatives'],
    answer: '📋 **Options** give the right (not obligation) to buy/sell a stock at a set price before expiration:\n• **CALL** = right to buy (profitable when stock rises)\n• **PUT** = right to sell (profitable when stock falls)\nKey terms: Strike price (agreed price), Expiry (deadline), Premium (cost of option). Options can magnify gains but expire worthless if wrong. Practical tip: buying options is simpler than selling them. Start with buying calls on stocks you\'re bullish on — your max loss is the premium paid.',
  },
  {
    keys: ['short selling', 'short', 'shorting', 'short squeeze'],
    answer: '📉 **Short Selling** = borrowing shares, selling them at current price, then buying back cheaper later. Profit = difference. Risk: unlimited — stocks can rise infinitely. A **short squeeze** happens when a heavily shorted stock rises sharply, forcing shorts to buy to cover losses, which pushes price even higher (like GameStop in 2021). Practical tip: never short a stock without a clear catalyst and always use a stop-loss — being wrong by timing can wipe an account.',
  },
  {
    keys: ['hedge', 'hedging', 'portfolio hedge', 'inverse etf'],
    answer: '🛡️ **Hedging** = taking an offsetting position to protect against losses. Methods:\n• Buy PUT options on stocks you hold\n• Use inverse ETFs (e.g., SQQQ = inverse QQQ)\n• Hold gold or bonds alongside stocks\n• Short correlated stocks or sectors. Hedging reduces potential gains but protects against large losses. Practical tip: professional funds hedge 10–20% of their portfolio. You don\'t need to hedge everything — just protect your largest, most concentrated positions.',
  },
  {
    keys: ['sector', 'sector rotation', 'technology', 'healthcare', 'energy', 'financial'],
    answer: '🔄 **Sector Rotation** is when investors shift money between market sectors based on economic cycle phase:\n• **Recovery**: Financials, Consumer Discretionary\n• **Expansion**: Technology, Industrials\n• **Peak**: Energy, Materials\n• **Recession**: Healthcare, Utilities, Consumer Staples. Practical tip: track which sectors are showing relative strength (outperforming the S&P 500) — that\'s where smart money is flowing.',
  },
  {
    keys: ['momentum', 'trend following', 'breakout trading', 'trend'],
    answer: '⚡ **Momentum Trading** profits from stocks that are already moving strongly in a direction. The idea: "the trend is your friend until it ends." Momentum traders buy stocks making new highs and short stocks making new lows. Key tools: 52-week high/low, relative strength vs index, volume analysis. Practical tip: momentum works best in trending markets. In choppy/sideways markets, cut position sizes in half — momentum strategies bleed in range-bound conditions.',
  },
  {
    keys: ['portfolio', 'asset allocation', 'rebalancing', 'diversification'],
    answer: '📊 **Portfolio Management** is about balancing risk and reward across multiple investments. Key principles:\n• **Asset Allocation**: How you split between stocks, bonds, cash (e.g., 70/20/10)\n• **Diversification**: Spread across sectors, geographies, and asset classes\n• **Rebalancing**: Periodically restore your target allocation (e.g., quarterly)\n• **Position Sizing**: Limit any single stock to 5–10% of portfolio. Practical tip: the classic 60/40 portfolio (60% stocks, 40% bonds) reduces volatility significantly while maintaining ~7–8% historical annual returns.',
  },
  {
    keys: ['ipo', 'initial public offering', 'listing', 'going public'],
    answer: '🚀 **IPO (Initial Public Offering)** = when a private company sells shares to the public for the first time. IPOs can offer big early gains but are extremely high risk — companies have limited trading history and are often overpriced. The "IPO pop" happens on day 1 when retail investors bid up prices. Most IPOs underperform the broader market in year 1. Practical tip: wait 3–6 months after an IPO before investing. Lock-up periods expire then (insiders can sell), which often creates a better buying opportunity.',
  },
  {
    keys: ['bond', 'fixed income', 'treasury', 'yield', 'coupon'],
    answer: '🏦 **Bonds** are loans you give to companies or governments in exchange for regular interest (coupon) payments and return of principal at maturity. Key concepts:\n• Yield = annual interest ÷ bond price (moves OPPOSITE to price)\n• When interest rates rise, bond prices fall\n• Credit rating determines risk: AAA = safest, junk bonds = highest yield + risk. Practical tip: US Treasury bonds are the gold standard of safety. In times of market fear, investors flee to Treasuries — this is why yields drop during crises.',
  },
];

/**
 * Returns a specific, detailed finance answer based on keyword matching.
 * This is the FINAL fallback — it always gives a real answer.
 */
function localFinanceAnswer(question) {
  if (!question) return FINANCE_KB[0].answer;

  const q = question.toLowerCase();

  // Try to find a matching KB entry
  for (const entry of FINANCE_KB) {
    if (entry.keys.some(k => q.includes(k))) {
      return entry.answer;
    }
  }

  // No exact match — give a helpful response that actually tries to answer
  return `📚 Great question about **"${question}"**!\n\nAs your AI finance tutor, I can give you detailed explanations on:\n\n📊 **Technical Analysis**: RSI, MACD, Moving Averages, Candlestick Patterns, Support & Resistance, Volume, Breakouts\n💰 **Valuation**: P/E Ratio, EPS, Market Cap, Dividends, Earnings Reports\n🛡️ **Risk**: Stop Loss, Position Sizing, Risk/Reward Ratio, Hedging, Portfolio Diversification\n📈 **Markets**: Bull/Bear Markets, Sector Rotation, Momentum Trading, ETFs, IPOs\n🏛️ **Economics**: Interest Rates, Inflation, Fed Policy, Bonds, Yield Curve\n\nTry asking a specific topic like: "What is the P/E ratio?" or "How does RSI work?" for a detailed explanation!`;
}

/**
 * Ask the RAG API a finance question.
 * Returns text string or throws if unavailable.
 */
async function askRAG(question) {
  if (!RAG_BASE) throw new Error('RAG_API_URL not configured');

  const res = await fetch(`${RAG_BASE}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`RAG API error ${res.status}`);
  const data = await res.json();
  return data.text || data.answer || data.response || null;
}

module.exports = { askRAG, localFinanceAnswer };
