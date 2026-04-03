/**
 * staticData.js
 * Frontend-only static data used for UI rendering.
 * Does NOT contain any API keys or server logic.
 * All live data is fetched via apiClient.js from the Express backend.
 */

export const STOCKS = [
  { symbol: 'RELIANCE.NS',  name: 'Reliance Industries', price: 1280.00, change: 12.50, changePercent: 0.98,  sector: 'Energy',     volume: '8.2M',  risk: 'moderate' },
  { symbol: 'TCS.NS',       name: 'Tata Consultancy',    price: 3450.00, change: -22.0, changePercent: -0.63, sector: 'Technology', volume: '3.1M',  risk: 'low'      },
  { symbol: 'INFY.NS',      name: 'Infosys Ltd.',        price: 1520.00, change: 18.70, changePercent: 1.24,  sector: 'Technology', volume: '6.8M',  risk: 'low'      },
  { symbol: 'HDFCBANK.NS',  name: 'HDFC Bank',           price: 1740.00, change: -9.50, changePercent: -0.54, sector: 'Finance',    volume: '9.4M',  risk: 'low'      },
  { symbol: 'WIPRO.NS',     name: 'Wipro Ltd.',          price: 468.00,  change: 5.20,  changePercent: 1.12,  sector: 'Technology', volume: '7.3M',  risk: 'moderate' },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank',          price: 1185.00, change: 14.30, changePercent: 1.22,  sector: 'Finance',    volume: '12.1M', risk: 'moderate' },
  { symbol: 'SBIN.NS',      name: 'State Bank of India', price: 772.00,  change: -6.80, changePercent: -0.87, sector: 'Finance',    volume: '18.6M', risk: 'moderate' },
  { symbol: 'BAJFINANCE.NS',name: 'Bajaj Finance',       price: 6850.00, change: 85.00, changePercent: 1.26,  sector: 'Finance',    volume: '1.2M',  risk: 'high'     },
  { symbol: 'TATAMOTORS.NS',name: 'Tata Motors',         price: 690.00,  change: -11.2, changePercent: -1.60, sector: 'Automotive', volume: '14.5M', risk: 'high'     },
  { symbol: 'HINDUNILVR.NS',name: 'Hindustan Unilever',  price: 2320.00, change: 8.40,  changePercent: 0.36,  sector: 'FMCG',       volume: '2.8M',  risk: 'low'      },
];

export const MOCK_LEADERBOARD = [
  { rank: 1, name: 'TradeMaster99', points: 8420, delta: +312, winRate: 72, badges: ['Market Guru', 'Risk Master'] },
  { rank: 2, name: 'BullRunKing',   points: 7815, delta: -180, winRate: 68, badges: ['First Profit'] },
  { rank: 3, name: 'AlphaHunter',   points: 7203, delta: +450, winRate: 65, badges: ['Risk Master'] },
  { rank: 4, name: 'QuantQueen',    points: 6540, delta: +210, winRate: 61, badges: ['Diversified'] },
  { rank: 5, name: 'You',           points: 500,  delta: 0,    winRate: 0,  badges: [], isCurrentUser: true },
];

export const LEARNING_MODULES = [
  {
    id: 'rsi', title: 'Understanding RSI', icon: '📊', difficulty: 'Beginner', xpReward: 50,
    lessons: [
      { title: 'What is RSI?', content: 'The Relative Strength Index (RSI) is a momentum oscillator that measures the speed and change of price movements. It ranges from 0 to 100 and was developed by J. Welles Wilder in 1978. RSI compares the magnitude of recent gains to recent losses to evaluate overbought and oversold conditions.' },
      { title: 'Reading RSI Levels', content: 'RSI above 70 signals the asset may be overbought — meaning it has risen a lot and could be due for a pullback. RSI below 30 signals oversold — the asset may have fallen too fast and a bounce could be coming. The 50 level acts as a midpoint: above = bullish momentum, below = bearish momentum.' },
      { title: 'RSI Divergence', content: 'Divergence is one of RSI\'s most powerful signals. Bullish divergence: price makes a lower low but RSI makes a higher low — momentum is weakening on the downside. Bearish divergence: price makes a higher high but RSI makes a lower high — the rally is losing steam. Both signal potential reversals.' },
      { title: 'RSI in StockQuest', content: 'In StockQuest, the RSI indicator is shown on the Dashboard for the selected stock. When RSI > 70, consider a DOWN bet — the stock may correct. When RSI < 30, consider an UP bet — a bounce may be near. Combine RSI with trend direction for stronger conviction before placing your bet.' },
      { title: 'RSI Limitations', content: 'RSI is a lagging indicator — it reacts to price, not predict it. In strong trending markets, RSI can stay overbought/oversold for extended periods. Never use RSI alone. Combine it with Moving Averages, Volume, or Sentiment for a complete picture before committing your stake.' },
    ],
  },
  {
    id: 'ma', title: 'Moving Averages', icon: '📈', difficulty: 'Beginner', xpReward: 50,
    lessons: [
      { title: 'Simple Moving Average (SMA)', content: 'A Simple Moving Average smooths price data by calculating the average price over a specific number of periods. A 50-day SMA averages the last 50 closing prices. It removes day-to-day noise and helps you see the underlying trend direction. When price is above the SMA, trend is up; below it, trend is down.' },
      { title: 'Exponential Moving Average (EMA)', content: 'The EMA gives more weight to recent prices than the SMA. This makes it more responsive to new information. The 12-day and 26-day EMAs are popular for short-term trading. EMA reacts faster to price changes, making it better for catching trends early — but also more prone to false signals.' },
      { title: 'Golden Cross & Death Cross', content: 'A Golden Cross occurs when the 50-day MA crosses above the 200-day MA — a bullish signal that suggests a long-term uptrend may begin. A Death Cross is the opposite: 50-day crosses below 200-day — a bearish signal. These are major signals watched by institutional traders.' },
      { title: 'Using MAs in StockQuest', content: 'Look at whether the current price is above or below the moving average. Price above MA = bullish momentum; consider UP bets. Price below MA = bearish momentum; consider DOWN bets. When a Golden Cross appears on a stock in StockQuest, it\'s a strong signal to place an UP bet with a 2x multiplier.' },
    ],
  },
  {
    id: 'volume', title: 'Volume Analysis', icon: '📉', difficulty: 'Intermediate', xpReward: 40,
    lessons: [
      { title: 'What is Volume?', content: 'Volume is the number of shares traded during a given period. It\'s the fuel behind price movement. High volume means many participants agree on a direction — the move is more reliable. Low volume means weak conviction — the move may reverse quickly. Always check volume before placing a bet.' },
      { title: 'Volume Confirms Trends', content: 'A price breakout to new highs with HIGH volume = strong, valid move. Follow it. A breakout with LOW volume = weak, possibly fake move — wait for confirmation. Similarly, a price drop on high volume = strong sellers in control (bearish). A drop on low volume = exhaustion, possible bounce coming.' },
      { title: 'Volume Spikes', content: 'A sudden spike in volume (3x–5x the average) often marks a turning point — either the beginning or end of a big move. After a long downtrend, a high-volume spike can mean capitulation: panic sellers exiting and smart money buying. This often precedes a sharp reversal upward.' },
    ],
  },
  {
    id: 'sentiment', title: 'Market Sentiment', icon: '🧠', difficulty: 'Intermediate', xpReward: 75,
    lessons: [
      { title: 'What is Market Sentiment?', content: 'Market sentiment is the overall attitude of investors toward a stock or market. It\'s driven by emotions — fear and greed — more than fundamentals. Sentiment can push a stock far above or below its fair value. Understanding sentiment helps you trade the crowd, not against it blindly.' },
      { title: 'Fear & Greed', content: 'Extreme greed often precedes market tops — everyone is buying, no sellers left, price has nowhere to go but down. Extreme fear often precedes bottoms — everyone has sold, sellers exhausted, smart money quietly accumulating. The contrarian approach: buy when others are fearful, sell when others are greedy.' },
      { title: 'The Crowd Intelligence Score', content: 'In StockQuest, the Crowd Intel tab shows a Hybrid Score for each stock — combining real user votes (Bullish/Bearish) with an AI sentiment signal. A score above 65 = strong bullish crowd sentiment. Below 35 = bearish consensus. The score updates as users vote, making it a live sentiment gauge.' },
      { title: 'Contrarian vs. Momentum', content: 'Two valid strategies: (1) Momentum — follow the crowd when sentiment is rising, ride the wave. (2) Contrarian — bet against extreme sentiment. Neither is always right. In StockQuest, use the Hybrid Score combined with technical indicators to decide which approach fits the current setup.' },
      { title: 'News & Catalyst Events', content: 'Earnings reports, Fed announcements, product launches — these are catalysts that shift sentiment instantly. Stocks often move 5–15% on earnings alone. In StockQuest\'s Event Mode, volatility is amplified around such events. High-risk, high-reward — only bet with your edge, not on hope.' },
      { title: 'Putting Sentiment Into Practice', content: 'Before placing a bet: check the Crowd Intel score. If 70%+ bullish and RSI is approaching 70, the crowd may be too greedy — consider a contrarian DOWN bet. If 60%+ bearish but price has been holding support for 3 days, it could be an oversold bounce setup — UP bet with your edge.' },
    ],
  },
  {
    id: 'risk', title: 'Risk Management', icon: '🛡️', difficulty: 'Intermediate', xpReward: 75,
    lessons: [
      { title: 'The #1 Rule: Protect Capital', content: 'The most important skill in trading is not picking winners — it\'s surviving losses. A trader who loses 50% of their capital needs a 100% gain just to break even. In StockQuest, think of your points as capital: preserve them first, grow them second. Never risk more than 20% on a single bet.' },
      { title: 'Position Sizing', content: 'Position sizing is how much you stake on each bet. The Kelly Criterion suggests risking a fraction of your edge. A practical rule: risk 1–5% of total points per bet on high-risk plays, up to 10% on high-conviction setups. In StockQuest, use the 1x multiplier while learning, reserve 2x–3x for your best setups.' },
      { title: 'Stop Losses', content: 'A stop loss is a predetermined exit point if the trade goes against you. It removes emotion from the decision. Example: you buy at $100, your stop is $95 (5% loss). If it hits $95, you exit — no debate, no hope. In StockQuest, think of your bet duration as a natural stop: the position closes at the end of the period.' },
      { title: 'Risk/Reward Ratio', content: 'Before placing any trade, ask: what\'s my potential gain vs. my potential loss? A good risk/reward ratio is at least 1:2 — risk 50 pts to potentially win 100 pts. Never risk more than you stand to gain. In StockQuest with multipliers, a 2x bet on 50 pts risks 50 to win 100 — that\'s a solid 1:2 ratio.' },
      { title: 'Diversification & Correlation', content: 'Don\'t concentrate all your bets in one sector. If you\'re already long AAPL (Tech), placing another bet on MSFT and NVDA means three correlated positions — if Tech sells off, all three lose. Spread bets across sectors (Tech, Finance, Healthcare) to reduce correlated risk. In StockQuest, mix your active bets across different symbols.' },
    ],
  },
  {
    id: 'options', title: 'Options Basics', icon: '🎯', difficulty: 'Advanced', xpReward: 100,
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
  volume: [
    { q: 'A breakout on HIGH volume is considered...', options: ['Weak and unreliable', 'Strong and valid', 'Bearish', 'Irrelevant'], answer: 1 },
    { q: 'A volume spike after a long downtrend often signals...', options: ['More selling ahead', 'Capitulation and potential reversal', 'A new downtrend', 'Nothing significant'], answer: 1 },
    { q: 'Low volume on a price breakout means...', options: ['Strong confirmation', 'Weak conviction — wait for confirmation', 'Guaranteed continuation', 'Buy immediately'], answer: 1 },
  ],
  sentiment: [
    { q: 'Extreme greed in the market often precedes...', options: ['A market top', 'A market bottom', 'Stable prices', 'Increased volume'], answer: 0 },
    { q: 'A contrarian trader buys when...', options: ['Everyone is greedy', 'Everyone is fearful', 'Volume is low', 'RSI is at 50'], answer: 1 },
    { q: 'In StockQuest, a Hybrid Score above 65 signals...', options: ['Strong bearish sentiment', 'Strong bullish crowd sentiment', 'Neutral market', 'High volatility'], answer: 1 },
  ],
  risk: [
    { q: 'Losing 50% of capital requires _____ gain to break even.', options: ['50%', '75%', '100%', '25%'], answer: 2 },
    { q: 'A good risk/reward ratio is at least...', options: ['1:1', '1:2', '2:1', '3:1'], answer: 1 },
    { q: 'To reduce correlated risk, you should...', options: ['Bet on stocks in the same sector', 'Diversify across different sectors', 'Use the highest multiplier', 'Place bets as often as possible'], answer: 1 },
  ],
  options: [
    { q: 'A Call option gives you the right to...', options: ['Sell a stock', 'Buy a stock', 'Short a stock', 'Hold a stock forever'], answer: 1 },
    { q: 'Theta in options means...', options: ['Profit from price movement', 'Loss from time passing (time decay)', 'Sensitivity to volatility', 'The option\'s intrinsic value'], answer: 1 },
    { q: 'Implied Volatility being HIGH means options are...', options: ['Cheap', 'Expensive', 'Neutral', 'At-the-money'], answer: 1 },
  ],
};
