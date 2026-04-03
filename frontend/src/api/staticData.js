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

// ── difficulty tiers: Beginner → Intermediate → Hard ─────────────────────────
export const LEARNING_MODULES = [
  {
    id: 'rsi', title: 'Understanding RSI', icon: '📊', difficulty: 'Beginner', xpReward: 50,
    externalLinks: [
      { label: 'RSI Explained — Investopedia', url: 'https://www.investopedia.com/terms/r/rsi.asp' },
      { label: 'RSI Trading Strategies — Fidelity', url: 'https://www.fidelity.com/learning-center/trading-investing/technical-analysis/technical-indicator-guide/RSI' },
      { label: 'RSI Deep Dive — StockCharts', url: 'https://school.stockcharts.com/doku.php?id=technical_indicators:relative_strength_index_rsi' },
    ],
    lessons: [
      { title: 'What is RSI?', content: 'The Relative Strength Index (RSI) is a momentum oscillator that measures the speed and change of price movements. It ranges from 0 to 100 and was developed by J. Welles Wilder in 1978. RSI compares the magnitude of recent gains to recent losses to evaluate overbought and oversold conditions.' },
      { title: 'Reading RSI Levels', content: 'RSI above 70 signals the asset may be overbought — meaning it has risen a lot and could be due for a pullback. RSI below 30 signals oversold — the asset may have fallen too fast and a bounce could be coming. The 50 level acts as a midpoint: above = bullish momentum, below = bearish momentum.' },
      { title: 'RSI Divergence', content: 'Divergence is one of RSI\'s most powerful signals. Bullish divergence: price makes a lower low but RSI makes a higher low — momentum is weakening on the downside. Bearish divergence: price makes a higher high but RSI makes a lower high — the rally is losing steam. Both signal potential reversals.' },
      { title: 'RSI in StockQuest', content: 'In StockQuest, the RSI indicator is shown on the Dashboard for the selected stock. When RSI > 70, consider a DOWN bet — the stock may correct. When RSI < 30, consider an UP bet — a bounce may be near. Combine RSI with trend direction for stronger conviction before placing your bet.' },
      { title: 'RSI Limitations', content: 'RSI is a lagging indicator — it reacts to price, not predict it. In strong trending markets, RSI can stay overbought/oversold for extended periods. Never use RSI alone. Combine it with Moving Averages, Volume, or Sentiment for a complete picture before committing your stake.' },
      { title: 'RSI Period Settings', content: 'The standard RSI uses a 14-period lookback. A shorter period (e.g., 7) makes RSI more sensitive and generates more signals — but also more false positives. A longer period (e.g., 21) smooths out noise and gives fewer but more reliable signals. For intraday trading in StockQuest, the 14-period default is appropriate.' },
    ],
  },
  {
    id: 'ma', title: 'Moving Averages', icon: '📈', difficulty: 'Beginner', xpReward: 50,
    externalLinks: [
      { label: 'Moving Averages Guide — Investopedia', url: 'https://www.investopedia.com/terms/m/movingaverage.asp' },
      { label: 'Golden Cross vs Death Cross — Investopedia', url: 'https://www.investopedia.com/terms/g/goldencross.asp' },
      { label: 'EMA vs SMA — StockCharts', url: 'https://school.stockcharts.com/doku.php?id=technical_indicators:moving_averages' },
    ],
    lessons: [
      { title: 'Simple Moving Average (SMA)', content: 'A Simple Moving Average smooths price data by calculating the average price over a specific number of periods. A 50-day SMA averages the last 50 closing prices. It removes day-to-day noise and helps you see the underlying trend direction. When price is above the SMA, trend is up; below it, trend is down.' },
      { title: 'Exponential Moving Average (EMA)', content: 'The EMA gives more weight to recent prices than the SMA. This makes it more responsive to new information. The 12-day and 26-day EMAs are popular for short-term trading. EMA reacts faster to price changes, making it better for catching trends early — but also more prone to false signals.' },
      { title: 'Golden Cross & Death Cross', content: 'A Golden Cross occurs when the 50-day MA crosses above the 200-day MA — a bullish signal that suggests a long-term uptrend may begin. A Death Cross is the opposite: 50-day crosses below 200-day — a bearish signal. These are major signals watched by institutional traders.' },
      { title: 'Using MAs in StockQuest', content: 'Look at whether the current price is above or below the moving average. Price above MA = bullish momentum; consider UP bets. Price below MA = bearish momentum; consider DOWN bets. When a Golden Cross appears on a stock in StockQuest, it\'s a strong signal to place an UP bet with a 2x multiplier.' },
      { title: 'MA Crossover Strategies', content: 'A popular strategy is the dual MA crossover: when the short-period MA (e.g., 20-day) crosses above the longer-period MA (e.g., 50-day), it generates a BUY signal. The reverse generates a SELL signal. This removes emotion from trading decisions. In StockQuest, watch for these crosspoints on the price chart.' },
      { title: 'Combining MAs with Other Indicators', content: 'Moving averages work best as a confirmation tool. Never use them alone. Use a MA crossover to identify trend direction, then check RSI to time your entry — only enter when RSI is below 50 on a bullish crossover. Add volume confirmation: a crossover with above-average volume is far more reliable.' },
    ],
  },
  {
    id: 'volume', title: 'Volume Analysis', icon: '📉', difficulty: 'Intermediate', xpReward: 60,
    externalLinks: [
      { label: 'Volume Indicator Guide — Investopedia', url: 'https://www.investopedia.com/terms/v/volume.asp' },
      { label: 'How Volume Confirms Price — TradingView', url: 'https://www.tradingview.com/scripts/volume/' },
      { label: 'Volume Price Trend — StockCharts', url: 'https://school.stockcharts.com/doku.php?id=technical_indicators:volume' },
    ],
    lessons: [
      { title: 'What is Volume?', content: 'Volume is the number of shares traded during a given period. It\'s the fuel behind price movement. High volume means many participants agree on a direction — the move is more reliable. Low volume means weak conviction — the move may reverse quickly. Always check volume before placing a bet.' },
      { title: 'Volume Confirms Trends', content: 'A price breakout to new highs with HIGH volume = strong, valid move. Follow it. A breakout with LOW volume = weak, possibly fake move — wait for confirmation. Similarly, a price drop on high volume = strong sellers in control (bearish). A drop on low volume = exhaustion, possible bounce coming.' },
      { title: 'Volume Spikes', content: 'A sudden spike in volume (3x–5x the average) often marks a turning point — either the beginning or end of a big move. After a long downtrend, a high-volume spike can mean capitulation: panic sellers exiting and smart money buying. This often precedes a sharp reversal upward.' },
      { title: 'On-Balance Volume (OBV)', content: 'OBV is a cumulative indicator that adds volume on up days and subtracts it on down days. Rising OBV while price is flat means hidden accumulation — buyers are absorbing stock quietly. Falling OBV with flat price signals quiet distribution — sellers are unloading. OBV divergences often predict major price moves 2–5 days ahead.' },
      { title: 'Average Volume Context', content: 'Volume is only meaningful relative to the stock\'s own average. A stock that normally trades 1M shares seeing 5M shares traded is significant. But a stock that normally trades 50M shares seeing 5M is actually very quiet. In StockQuest, always compare current volume to the displayed average volume before concluding a move is significant.' },
      { title: 'Volume in Low-Cap vs. Large-Cap Stocks', content: 'Low-cap stocks (under $2B market cap) can be moved significantly by retail buying. High volume on a low-cap = dramatic price swings. Large-cap stocks (AAPL, MSFT) require institutional participation to move on volume. In StockQuest, TSLA and NVDA have inherently higher volume and volatility — expect larger swings when volume spikes.' },
    ],
  },
  {
    id: 'sentiment', title: 'Market Sentiment', icon: '🧠', difficulty: 'Intermediate', xpReward: 75,
    externalLinks: [
      { label: 'Market Sentiment Explained — Investopedia', url: 'https://www.investopedia.com/terms/m/marketsentiment.asp' },
      { label: 'Fear & Greed Index — CNN Business', url: 'https://edition.cnn.com/markets/fear-and-greed' },
      { label: 'Sentiment Analysis in Finance — CFA Institute', url: 'https://www.cfainstitute.org/en/research/cfa-magazine/2012/the-role-of-sentiment-in-financial-markets' },
    ],
    lessons: [
      { title: 'What is Market Sentiment?', content: 'Market sentiment is the overall attitude of investors toward a stock or market. It\'s driven by emotions — fear and greed — more than fundamentals. Sentiment can push a stock far above or below its fair value. Understanding sentiment helps you trade the crowd, not against it blindly.' },
      { title: 'Fear & Greed', content: 'Extreme greed often precedes market tops — everyone is buying, no sellers left, price has nowhere to go but down. Extreme fear often precedes bottoms — everyone has sold, sellers exhausted, smart money quietly accumulating. The contrarian approach: buy when others are fearful, sell when others are greedy.' },
      { title: 'The Crowd Intelligence Score', content: 'In StockQuest, the People tab shows a Hybrid Score for each stock — combining real user votes (Bullish/Bearish) with an AI sentiment signal. A score above 65 = strong bullish crowd sentiment. Below 35 = bearish consensus. The score updates as users vote, making it a live sentiment gauge.' },
      { title: 'Contrarian vs. Momentum', content: 'Two valid strategies: (1) Momentum — follow the crowd when sentiment is rising, ride the wave. (2) Contrarian — bet against extreme sentiment. Neither is always right. In StockQuest, use the Hybrid Score combined with technical indicators to decide which approach fits the current setup.' },
      { title: 'News & Catalyst Events', content: 'Earnings reports, Fed announcements, product launches — these are catalysts that shift sentiment instantly. Stocks often move 5–15% on earnings alone. In StockQuest\'s Event Mode, volatility is amplified around such events. High-risk, high-reward — only bet with your edge, not on hope.' },
      { title: 'Putting Sentiment Into Practice', content: 'Before placing a bet: check the People score. If 70%+ bullish and RSI is approaching 70, the crowd may be too greedy — consider a contrarian DOWN bet. If 60%+ bearish but price has been holding support for 3 days, it could be an oversold bounce setup — UP bet with your edge.' },
    ],
  },
  {
    id: 'risk', title: 'Risk Management', icon: '🛡️', difficulty: 'Hard', xpReward: 100,
    externalLinks: [
      { label: 'Risk Management 101 — Investopedia', url: 'https://www.investopedia.com/terms/r/riskmanagement.asp' },
      { label: 'Kelly Criterion Explained — Investopedia', url: 'https://www.investopedia.com/terms/k/kellycriterion.asp' },
      { label: 'Position Sizing Strategies — TastyTrade', url: 'https://tastytrade.com/learn/position-sizing/' },
    ],
    lessons: [
      { title: 'The #1 Rule: Protect Capital', content: 'The most important skill in trading is not picking winners — it\'s surviving losses. A trader who loses 50% of their capital needs a 100% gain just to break even. In StockQuest, think of your points as capital: preserve them first, grow them second. Never risk more than 20% on a single bet.' },
      { title: 'Position Sizing', content: 'Position sizing is how much you stake on each bet. The Kelly Criterion suggests risking a fraction of your edge. A practical rule: risk 1–5% of total points per bet on high-risk plays, up to 10% on high-conviction setups. In StockQuest, use the 1x multiplier while learning, reserve 2x–3x for your best setups.' },
      { title: 'Stop Losses', content: 'A stop loss is a predetermined exit point if the trade goes against you. It removes emotion from the decision. Example: you buy at $100, your stop is $95 (5% loss). If it hits $95, you exit — no debate, no hope. In StockQuest, think of your bet duration as a natural stop: the position closes at the end of the period.' },
      { title: 'Risk/Reward Ratio', content: 'Before placing any trade, ask: what\'s my potential gain vs. my potential loss? A good risk/reward ratio is at least 1:2 — risk 50 pts to potentially win 100 pts. Never risk more than you stand to gain. In StockQuest with multipliers, a 2x bet on 50 pts risks 50 to win 100 — that\'s a solid 1:2 ratio.' },
      { title: 'Diversification & Correlation', content: 'Don\'t concentrate all your bets in one sector. If you\'re already long AAPL (Tech), placing another bet on MSFT and NVDA means three correlated positions — if Tech sells off, all three lose. Spread bets across sectors (Tech, Finance, Healthcare) to reduce correlated risk. In StockQuest, mix your active bets across different symbols.' },
      { title: 'Drawdown Management', content: 'Drawdown is the peak-to-trough decline of your account. A 20% drawdown after a bad streak is a warning signal — reduce bet sizes by half until you recover. Professional traders follow a "circuit breaker" rule: if they lose 10% in a single day, they stop trading until the next session. Apply this discipline in StockQuest to stay solvent.' },
    ],
  },
  {
    id: 'options', title: 'Options Basics', icon: '🎯', difficulty: 'Hard', xpReward: 150,
    externalLinks: [
      { label: 'Options Trading Basics — CBOE Hub', url: 'https://www.cboe.com/education/' },
      { label: 'Options Greeks Explained — Investopedia', url: 'https://www.investopedia.com/terms/g/greeks.asp' },
      { label: 'Calls and Puts — Khan Academy', url: 'https://www.khanacademy.org/economics-finance-domain/core-finance/derivative-securities/put-call-options/v/call-option-as-leverage' },
      { label: 'Implied Volatility — CBOE VIX', url: 'https://www.cboe.com/tradable_products/vix/' },
    ],
    lessons: [
      { title: 'What are Options?', content: 'An option is a contract giving the buyer the right — but not the obligation — to buy or sell an asset at a specific price (strike price) by a specific date (expiration). Options allow traders to profit from price movements with less capital than buying the stock outright. They are powerful but carry unique risks.' },
      { title: 'Calls and Puts', content: 'A Call option gives you the right to BUY. You buy a call when you think the stock will go UP. A Put option gives you the right to SELL. You buy a put when you think the stock will go DOWN. In StockQuest, your UP/DOWN bets are conceptually similar to buying calls and puts — you\'re taking a directional position.' },
      { title: 'The Premium', content: 'To buy an option, you pay a premium — the option\'s price. This is your maximum loss if the option expires worthless. The premium is determined by: (1) intrinsic value — how much the option is in-the-money, and (2) time value — how much time until expiration. More time = higher premium.' },
      { title: 'Strike Price & Moneyness', content: 'In-the-money (ITM): the option has intrinsic value. A call is ITM when stock price > strike price. At-the-money (ATM): stock price ≈ strike price. Most responsive to price movement. Out-of-the-money (OTM): no intrinsic value yet. Cheaper but requires a bigger move to profit. In StockQuest, shorter durations are like OTM options — low cost, need a big move.' },
      { title: 'Delta — Options Sensitivity', content: 'Delta measures how much an option\'s price changes when the stock moves $1. A call delta of 0.5 means the option gains $0.50 for every $1 the stock rises. ATM options have delta ≈ 0.5. Deep ITM options have delta ≈ 1 (move like the stock). OTM options have low delta (<0.3). In StockQuest, multiplier selection mirrors delta — higher multiplier = higher sensitivity.' },
      { title: 'Theta — Time Decay', content: 'Theta is the enemy of option buyers. Every day that passes, an option loses time value — even if the stock doesn\'t move. This is called time decay. Near expiration, theta accelerates. For option sellers, theta is a friend — they profit from time passing. In StockQuest, shorter bet durations (15m) are like buying near-expiry options — they need to move fast.' },
      { title: 'Implied Volatility', content: 'Implied Volatility (IV) reflects the market\'s expectation of future price swings. High IV = expensive options (market expects big moves). Low IV = cheap options (market expects calm). Buy options when IV is low, sell when IV is high. In StockQuest, Event Mode simulates high-IV conditions around earnings and macro announcements.' },
      { title: 'Putting It All Together', content: 'A complete options analysis: (1) Pick your direction (call or put). (2) Choose strike — ATM for balanced risk/reward. (3) Choose expiration — more time = more expensive but safer. (4) Check IV — don\'t overpay. (5) Size your position — max loss should be < 5% of capital. In StockQuest, apply this thinking to every bet: direction + multiplier (delta) + duration (theta).' },
    ],
  },
];

// ── 6 questions per category, tiered difficulty ───────────────────────────────
export const QUIZ_QUESTIONS = {
  rsi: [
    { q: 'What RSI level signals overbought conditions?', options: ['20', '50', '70', '90'], answer: 2 },
    { q: 'RSI below 30 typically indicates...', options: ['Overbought', 'Oversold', 'Neutral', 'Trending up'], answer: 1 },
    { q: 'RSI stands for...', options: ['Rate of Stock Index', 'Relative Strength Index', 'Risk-Scaled Indicator', 'Revenue Stability Index'], answer: 1 },
    { q: 'Bullish RSI divergence occurs when price makes a lower low but RSI makes a...', options: ['Lower low too', 'Higher low', 'Higher high', 'Double top'], answer: 1 },
    { q: 'The standard RSI period lookback used by most traders is...', options: ['7 periods', '10 periods', '14 periods', '21 periods'], answer: 2 },
    { q: 'In a strong uptrend, RSI can remain above 70 for an extended period. This means...', options: ['Always sell immediately at RSI 70', 'RSI alone is insufficient — combine with trend context', 'The stock is guaranteed to drop soon', 'RSI is broken in trending markets'], answer: 1 },
  ],
  ma: [
    { q: 'A Golden Cross occurs when...', options: ['50-day MA crosses above 200-day MA', 'Price drops below 50-day MA', 'Volume doubles', 'RSI hits 50'], answer: 0 },
    { q: 'EMA gives _____ weight to recent prices vs SMA.', options: ['Equal', 'Less', 'More', 'Random'], answer: 2 },
    { q: 'A Death Cross is a _____ signal.', options: ['Bullish', 'Neutral', 'Bearish', 'Confirming'], answer: 2 },
    { q: 'When price is consistently ABOVE the 50-day moving average, the trend is...', options: ['Bearish', 'Sideways', 'Bullish', 'Volatile'], answer: 2 },
    { q: 'Which moving average reacts FASTEST to new price data?', options: ['200-day SMA', '50-day SMA', '20-day EMA', '100-day SMA'], answer: 2 },
    { q: 'A dual MA crossover BUY signal is generated when...', options: ['Long-term MA crosses above short-term MA', 'Short-term MA crosses above long-term MA', 'Both MAs are declining', 'Price crosses below both MAs'], answer: 1 },
  ],
  volume: [
    { q: 'A breakout on HIGH volume is considered...', options: ['Weak and unreliable', 'Strong and valid', 'Bearish', 'Irrelevant'], answer: 1 },
    { q: 'A volume spike after a long downtrend often signals...', options: ['More selling ahead', 'Capitulation and potential reversal', 'A new downtrend', 'Nothing significant'], answer: 1 },
    { q: 'Low volume on a price breakout means...', options: ['Strong confirmation', 'Weak conviction — wait for confirmation', 'Guaranteed continuation', 'Buy immediately'], answer: 1 },
    { q: 'OBV (On-Balance Volume) rising while price is flat suggests...', options: ['Distribution — stock is being sold', 'Accumulation — buyers are absorbing supply', 'No significant activity', 'A volume indicator error'], answer: 1 },
    { q: 'Volume is most meaningful when compared to...', options: ['The stock\'s own historical average volume', 'The total market volume', 'Volume of other stocks', 'Yesterday\'s price change'], answer: 0 },
    { q: 'A price drop on VERY LOW volume most likely indicates...', options: ['Strong bearish momentum', 'Seller exhaustion — possible bounce ahead', 'A major breakdown', 'Confirmation of a downtrend'], answer: 1 },
  ],
  sentiment: [
    { q: 'Extreme greed in the market often precedes...', options: ['A market top', 'A market bottom', 'Stable prices', 'Increased volume'], answer: 0 },
    { q: 'A contrarian trader buys when...', options: ['Everyone is greedy', 'Everyone is fearful', 'Volume is low', 'RSI is at 50'], answer: 1 },
    { q: 'In StockQuest, a Hybrid Score above 65 signals...', options: ['Strong bearish sentiment', 'Strong bullish crowd sentiment', 'Neutral market', 'High volatility'], answer: 1 },
    { q: 'Which event typically causes the SHARPEST single-day price swings?', options: ['Random trading day', 'Earnings announcement', 'A quiet Tuesday', 'Low volume session'], answer: 1 },
    { q: 'The "buy the rumour, sell the news" phenomenon is an example of...', options: ['Fundamental analysis', 'Volume analysis', 'Sentiment-driven price behaviour', 'RSI divergence'], answer: 2 },
    { q: 'If 70%+ of StockQuest users are Bullish on a stock AND RSI is at 72, a smart contrarian might...', options: ['Buy immediately with 3× multiplier', 'Wait for RSI to drop below 50 before buying', 'Consider a DOWN bet anticipating a pullback', 'Ignore the signals entirely'], answer: 2 },
  ],
  risk: [
    { q: 'Losing 50% of capital requires _____ gain to break even.', options: ['50%', '75%', '100%', '25%'], answer: 2 },
    { q: 'A good risk/reward ratio is at least...', options: ['1:1', '1:2', '2:1', '3:1'], answer: 1 },
    { q: 'To reduce correlated risk, you should...', options: ['Bet on stocks in the same sector', 'Diversify across different sectors', 'Use the highest multiplier', 'Place bets as often as possible'], answer: 1 },
    { q: 'The Kelly Criterion is used to determine...', options: ['The right time to buy a stock', 'Optimal position size based on edge', 'When to cut losses', 'The best multiplier to use'], answer: 1 },
    { q: 'In StockQuest, a "circuit breaker" approach means...', options: ['Placing more bets after losses to recover', 'Stopping all bets after losing a defined amount in one session', 'Switching to 3× multiplier after a loss', 'Only betting on high-volatility stocks'], answer: 1 },
    { q: 'Which is the correct order of trading priorities?', options: ['Maximize gains → Protect capital → Manage risk', 'Protect capital → Manage risk → Maximize gains', 'Manage risk → Maximize gains → Protect capital', 'All are equally important simultaneously'], answer: 1 },
  ],
  options: [
    { q: 'A Call option gives you the right to...', options: ['Sell a stock', 'Buy a stock', 'Short a stock', 'Hold a stock forever'], answer: 1 },
    { q: 'Theta in options means...', options: ['Profit from price movement', 'Loss from time passing (time decay)', 'Sensitivity to volatility', 'The option\'s intrinsic value'], answer: 1 },
    { q: 'Implied Volatility being HIGH means options are...', options: ['Cheap', 'Expensive', 'Neutral', 'At-the-money'], answer: 1 },
    { q: 'An ATM (At-The-Money) option has a Delta of approximately...', options: ['0.1', '0.3', '0.5', '1.0'], answer: 2 },
    { q: 'You should generally BUY options when Implied Volatility is...', options: ['High — the market expects big moves', 'Low — options are cheap', 'At 50% — neutral environment', 'It doesn\'t matter'], answer: 1 },
    { q: 'An option is "In-The-Money" (ITM) when...', options: ['It has no intrinsic value', 'The stock price equals the strike price', 'The option has positive intrinsic value', 'Theta is positive'], answer: 2 },
  ],
};
