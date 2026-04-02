# ⚡ StockQuest — Gamified AI-Powered Investment Simulator

> A fully functional web prototype where users learn stock trading risk-free, interact with AI insights, earn points through gamification, and compete socially — built with React + Vite + Gemini AI.

---

## 🚀 How to Run

```powershell
# In the project folder (C:\Users\arx_g\OneDrive\buildathon)
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
& "C:\Program Files\nodejs\npm.cmd" install   # First time only
& "C:\Program Files\nodejs\npm.cmd" run dev   # Starts app at http://localhost:5173
```

> **Permanent fix**: Add `C:\Program Files\nodejs` to your Windows System PATH so plain `npm run dev` works every time.

---

## 🗂️ Project Architecture

```
buildathon/
├── index.html                    # HTML entry point (Inter font, SEO meta tags)
├── vite.config.js                # Vite + React plugin config
├── package.json                  # Dependencies: react, recharts, lucide-react
├── .env                          # 🔑 VITE_GEMINI_API_KEY (your real key)
├── .env.example                  # Template for the .env file
│
└── src/
    ├── main.jsx                  # Entry: wraps all Context providers
    ├── App.jsx                   # Root: tab navigation + page routing
    ├── index.css                 # 500-line premium design system (dark/light, glassmorphism)
    │
    ├── data/
    │   └── mockData.js           # Mock stocks, leaderboard, learning modules, quiz questions, sentiment feed
    │
    ├── engine/                   # ✅ Pure functions — NO React, NO side effects
    │   ├── OutcomeEngine.js      # calculateOutcome, resolveTimedBet, validateBet, getMaxStake, rollDoubleOrNothing
    │   ├── RewardsEngine.js      # BADGES, checkDailyLogin, getStreakBonus, checkBadgeUnlocks, generateDailyQuests
    │   ├── HybridSignalEngine.js # computeHybridScore, resolveContest, getSimModeConfig
    │   └── BacktestEngine.js     # runBacktest (equity curve, ROI, max drawdown), findOptimalEntry
    │
    ├── services/                 # ✅ External integrations
    │   ├── StorageService.js     # Versioned localStorage wrapper (DB-swappable via setRemote/getRemote stubs)
    │   └── AIFeedbackService.js  # Live Gemini 1.5 Flash API — generateTradeExplanation, getImprovementTip, answerTradingQuestion, getStockRecommendations
    │
    ├── context/                  # ✅ React state management (persisted to localStorage via StorageService)
    │   ├── ThemeContext.jsx            # dark/light theme — persisted
    │   ├── GamificationContext.jsx     # SOURCE OF TRUTH: points, activeBets, badges, quests, streaks, riskProfile
    │   ├── PortfolioContext.jsx        # tradeHistory, P&L, win rate, reputation score, friends, leagues
    │   └── CrowdIntelligenceContext.jsx# votes, aiSentiment, simMode, challenges, contests
    │
    └── components/               # ✅ Thin UI only — all logic lives in /engine & /services
        ├── Header.jsx                  # Sticky nav: tabs, points badge, streak, badge count, theme toggle
        ├── OutcomeNotification.jsx     # Animated toast for wins, losses, badge unlocks
        ├── StockDashboard.jsx          # Stock ticker, price/volume chart (Recharts), RSI, MA20, Crowd+AI indicator
        ├── InvestActionPanel.jsx       # Stock picker, stake, direction, 1x/2x/3x multiplier, timer, risk profile, active bets, double-or-nothing
        ├── RewardsDashboard.jsx        # Login streak calendar, daily quests with progress + claim, badge collection grid
        ├── HallOfFame.jsx              # Ultra-rare legendary/epic achievement showcase
        ├── PortfolioTracker.jsx        # P&L stats, area chart, best/worst trades, filterable history table
        ├── Leaderboard.jsx             # Global/daily/weekly podium, rank delta, reputation score column
        ├── SocialHub.jsx               # 1v1 battle invites, private leagues, friends list (online dot), share card
        ├── TradeExplainer.jsx          # AI post-mortem (live Gemini), typewriter reveal, personalised tip
        ├── LearningHub.jsx             # Course cards with progress bars, built-in quiz modal, point rewards
        ├── AIChatBot.jsx               # Floating chatbot — quick-reply chips, live Gemini answers, typing indicator
        ├── SimulationModeSelector.jsx  # Beginner / Pro / Event mode picker (colour-coded)
        ├── TimeChallengePanel.jsx      # Create 1-minute predictions, countdown timers, reward on correct call
        ├── CrowdIntelligenceDashboard.jsx # Sentiment feed, vote bars (bullish/bearish %), Crowd+AI hybrid score
        └── FlashContestRoom.jsx        # Flash contest rooms: join with Up/Down, live timer bar, auto-resolve, confetti on win
```

---

## 📦 Modules Implemented

### Module D — Gamification Engine
| Feature | Implementation |
|---|---|
| Virtual points (start 500) | `GamificationContext` |
| Place / resolve bets | `OutcomeEngine.calculateOutcome` + `InvestActionPanel` |
| Risk multiplier 1x / 2x / 3x | `OutcomeEngine.getMaxStake` + `InvestActionPanel` |
| Timed bets (15m / 1h / 1d) | `OutcomeEngine.resolveTimedBet` |
| Daily login +10 pts | `RewardsEngine.checkDailyLogin` |
| 7-day streak bonus | `RewardsEngine.getStreakBonus` |
| Achievement badges (8 total) | `RewardsEngine.checkBadgeUnlocks` |
| Daily quests (3/day) | `RewardsEngine.generateDailyQuests` |
| Double-or-Nothing mode | `OutcomeEngine.rollDoubleOrNothing` |
| Smart stock alerts (±2%) | `OutcomeEngine.checkSmartAlert` |

### Module E — Performance + Social Layer
| Feature | Implementation |
|---|---|
| Trade history + P&L | `PortfolioContext` + `PortfolioTracker` |
| Win rate & reputation score | `PortfolioContext.calcStats` |
| P&L sparkline chart | `PortfolioTracker` (Recharts AreaChart) |
| Best / worst trade highlights | `PortfolioTracker` |
| Leaderboard (global/daily/weekly) | `Leaderboard` + `MOCK_LEADERBOARD` |
| Top-3 podium with crowns | `Leaderboard` |
| Rank delta badges (▲/▼) | `Leaderboard` |
| 1v1 battle invites | `SocialHub` (Battles tab) |
| Private leagues | `SocialHub` (Leagues tab) + `PortfolioContext` |
| Friends list + online status | `SocialHub` (Friends tab) |
| Portfolio share card | `SocialHub` (Share tab) |

### Module F — AI Feedback + Learning
| Feature | Implementation |
|---|---|
| **Live Gemini 1.5 Flash API** | `AIFeedbackService.callGemini` |
| Trade post-mortem analysis | `AIFeedbackService.generateTradeExplanation` + `TradeExplainer` |
| Typewriter AI reveal | `TradeExplainer` (CSS animation) |
| Personalised improvement tip | `AIFeedbackService.getImprovementTip` |
| AI chatbot (floating) | `AIChatBot` + `AIFeedbackService.answerTradingQuestion` |
| Quick-reply chips | `AIChatBot` |
| Learning modules (6 courses) | `LearningHub` + `LEARNING_MODULES` |
| Progress bar per module | `LearningHub` |
| Quiz modal (3 Qs each) | `LearningHub` (built-in) |
| Point rewards on quiz | `LearningHub` → `earnPoints` |
| Graceful fallback (no API key) | `AIFeedbackService.getFallback` |

### Module G — Advanced Modes + Crowd Intelligence
| Feature | Implementation |
|---|---|
| Simulation modes (Beginner / Pro / Event) | `SimulationModeSelector` + `HybridSignalEngine.getSimModeConfig` |
| Time challenges (1-min predictions) | `TimeChallengePanel` + `CrowdIntelligenceContext` |
| Crowd voting (bullish/bearish) | `CrowdIntelligenceDashboard` + `CrowdIntelligenceContext.castVote` |
| Crowd + AI hybrid score | `HybridSignalEngine.computeHybridScore` |
| Live sentiment feed | `CrowdIntelligenceDashboard` + `SENTIMENT_DATA` |
| Flash contest rooms | `FlashContestRoom` + `HybridSignalEngine.resolveContest` |
| Countdown timer + prize pool | `FlashContestRoom` |
| Confetti on win | `FlashContestRoom` |
| Strategy backtester | `BacktestEngine.runBacktest` (equity curve, ROI, max drawdown) |
| Hall of Fame (legendary badges) | `HallOfFame` |
| Dark / light theme toggle | `ThemeContext` (persisted) |

---

## 🔑 Environment Variables

| Variable | Purpose |
|---|---|
| `VITE_GEMINI_API_KEY` | Your Google Gemini API key — get free at [aistudio.google.com](https://aistudio.google.com) |
| `VITE_APP_ENV` | `development` or `production` |

> If no API key is set, the app uses built-in fallback responses and works fully offline.

---

## 🎨 Design System

| Property | Value |
|---|---|
| Theme | Dark-first with light toggle |
| Font | Inter (Google Fonts) + JetBrains Mono (prices/numbers) |
| Primary | `#3b82f6` (Electric Blue) |
| Success | `#10b981` (Emerald Green) |
| Danger | `#f43f5e` (Rose Red) |
| Warning / Gold | `#f59e0b` (Amber) |
| Background | `#060c18` (Deep Navy) |
| Style | Glassmorphism panels, smooth gradients, micro-animations |

---

## 🔮 Future Upgrades (Easy Drop-ins)

| Upgrade | How |
|---|---|
| Real backend (Node.js + Express) | Replace `StorageService.set/get` with `setRemote/getRemote` which already have fetch stubs |
| Real stock prices | Swap `STOCKS` in `mockData.js` with Alpha Vantage / Yahoo Finance API calls |
| Multi-user leaderboard | Replace `MOCK_LEADERBOARD` with a real DB query via the backend |
| WebSocket live prices | Add a WS connection in `StockDashboard` — context + engine are already structured to accept live prices |
| Real crowd votes | Replace `CrowdIntelligenceContext` state with server-synced votes |

---

*Built for the StockQuest Buildathon — Modules D, E, F & G*
