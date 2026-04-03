# StockQuest 🚀

# The Core Problem: Beginner investors lack a risk-free, high-fidelity environment to practice trading, leading to significant financial losses due to a lack of experience and an inability to analyze complex market news and data. 

# Our Solution: StockQuest is a gamified stock market simulator that bridges the gap between theory and practice. By combining real-time market data, AI-driven insights, and engaging game mechanics, we provide a risk-free environment for users to hone their trading skills, learn from their mistakes, and build the confidence needed to navigate the real markets. 

A **gamified, AI-powered stock market simulator** built with React + Vite (frontend) and Node.js + Express (backend), connected to MongoDB Atlas for persistent user data and a live leaderboard.

---

## 📁 Project Structure

```
BUILD-athon/
├── frontend/          # React + Vite application
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── context/       # React context providers
│   │   ├── api/           # API client & services
│   │   ├── services/      # AI & external service integrations
│   │   ├── utils/engines/ # Game logic engines
│   │   └── index.css      # Global styles
│   └── .env               # Frontend environment variables
└── backend/           # Node.js + Express API server
    ├── src/
    │   ├── routes/        # Express route handlers
    │   ├── services/      # Yahoo Finance, FinBERT services
    │   ├── data/          # Mock/static data
    │   └── index.js       # Server entry point
    ├── models.js          # Mongoose User schema
    ├── db.js              # MongoDB connection manager
    └── .env               # Backend environment variables
```

---

## 🛠 Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18, Vite, Context API         |
| Backend   | Node.js, Express.js                 |
| Database  | MongoDB Atlas (via Mongoose)        |
| AI/LLM    | Groq API — Llama 3.1 8B Instant     |
| Market Data | Yahoo Finance (no API key needed) |
| Styling   | Vanilla CSS with dark mode          |

---

## ✅ What Was Built & Fixed

### 🔐 Authentication System (Signup / Login / Logout)
- Added `password` field to the Mongoose `User` schema in `backend/src/models.js`
- Created `POST /api/users/signup` — registers a new user in MongoDB Atlas (prevents duplicate `userId`)
- Created `POST /api/users/login` — validates credentials against the database
- Built `AuthContext.jsx` — global React context managing `currentUser`, `isAuthenticated`, `login()`, `logout()` using `localStorage` for session persistence (hackathon-friendly, no JWT overhead)
- Built `AuthPage.jsx` — a premium, animated dark-mode login/signup screen that gates the entire app
- Updated `main.jsx` to wrap the app in `<AuthProvider>`
- Updated `App.jsx` to redirect unauthenticated users to `<AuthPage />`
- Added **Logout button** and **username display** to `Header.jsx`

### 🗄 MongoDB Atlas Integration
- Created `backend/src/db.js` — robust connection manager using `mongoose.connect()` that reads `MONGO_URI` from `.env` and exports `connectDB()` and `isConnected()`
- Created `backend/src/models.js` — full Mongoose `User` schema: `userId`, `username`, `password`, `points`, `streak`, `badges`, `lastLogin`
- Created `backend/src/routes/users.js` — Express router with:
  - `POST /signup` — new user registration
  - `POST /login` — credential validation
  - `PATCH /:userId/points` — update user points
  - `GET /leaderboard` — returns top 50 users sorted by points with rank
- Wired `connectDB()` into `backend/src/index.js` on server startup
- Installed `mongoose` npm package in the backend
- Created `backend/.env` with real MongoDB Atlas URI

### 🤖 FINBOT — AI Chatbot (Groq Llama 3.1)
- Created `frontend/src/services/AIFeedbackService.js`:
  - `callGroq(history)` — sends full conversation history to Groq for multi-turn context-aware responses
  - `answerTradingQuestion(history)` — wrapper with error handling
  - `getFallback()` — offline fallback message
- Rewrote `frontend/src/components/AIChatBot.jsx`:
  - Bot renamed to **FINBOT**
  - Full conversation history passed to Groq on each message (supports follow-up questions)
  - Input wrapped in `<form onSubmit>` for proper Enter-key submission
  - Supports `inline={true}` prop for embedding in dashboard panels
  - Floating FAB button shows 💬 icon
- **Replaced AI Market Insights panel** on the Stock Dashboard with FINBOT inline chatbot (`StockDashboard.jsx`)

### 📈 Buy / Sell Betting System
- Replaced **Up/Down** direction buttons with **Buy/Sell** in `InvestActionPanel.jsx`
- Updated `OutcomeEngine.js` (`calculateOutcome`) to handle `'buy'`/`'sell'` alongside legacy `'up'`/`'down'` directions — fixes **NaN points bug**
- Added `multiplier: 1` default to all new bet payloads to prevent NaN calculations
- Added `isNaN` safety guard in `calculateOutcome` — always returns `0` instead of `NaN`

### ⏱ Auto-Resolve Bets After Duration
- Added `useEffect` with `setInterval` (30-second polling) in `InvestActionPanel.jsx`
- Uses `resolveTimedBet(bet, currentPrice)` from `OutcomeEngine.js` to check if a bet's `15m`, `1h`, or `1d` duration has expired
- On expiry: automatically resolves the bet at the current live stock price, awards/deducts points, and triggers the **Double-or-Nothing** modal if the user won

### 📡 Yahoo Finance API Fix
- Fixed 404 errors from Yahoo Finance by:
  - Removing the broken crumb/cookie fetching logic
  - Correcting the URL query string formatter (was using `&` instead of `?` as separator)
  - Switched to prefer `query2` over `query1` as it's more stable for unauthenticated requests
- Verified `getQuote()` and `getHistory()` working correctly for AAPL and other tickers

### 🌿 Git Branch Management
- Pulled code from `frntd` branch of `https://github.com/rayyanshk03/GAME-athon.git`
- Committed all changes and force-pushed the `frntd` branch to the `main` branch on GitHub without altering the local workspace

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (or local MongoDB)
- Groq API key (free at [https://console.groq.com](https://console.groq.com))

### Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PORT=3001
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/stockquest?retryWrites=true&w=majority
FRONTEND_URL=http://localhost:5173
```

```bash
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_GROQ_API_KEY=your_groq_api_key_here
```

```bash
npm run dev
```

---

## 🔌 API Endpoints

| Method | Endpoint                      | Description                        |
|--------|-------------------------------|------------------------------------|
| POST   | `/api/users/signup`           | Register a new user                |
| POST   | `/api/users/login`            | Login with userId + password       |
| PATCH  | `/api/users/:userId/points`   | Update a user's points             |
| GET    | `/api/users/leaderboard`      | Top 50 users sorted by points      |
| GET    | `/api/stocks`                 | All available stocks               |
| GET    | `/api/stocks/:symbol`         | Quote for a specific stock         |
| GET    | `/api/stocks/:symbol/history` | Historical price data              |
| GET    | `/api/stocks/:symbol/news`    | Latest news for a stock            |
| GET    | `/api/health`                 | Server health check                |

---

## 🎮 Features

- **Gamified Trading** — Place Buy/Sell bets using points, with multipliers and Double-or-Nothing
- **Auto-Resolve Bets** — Bets automatically resolve after their set duration (15m, 1h, 1d)
- **FINBOT AI Tutor** — Context-aware Groq Llama 3.1 chatbot embedded in the dashboard
- **Live Leaderboard** — All registered users ranked by points from MongoDB
- **Sentiment Analysis** — FinBERT-based news sentiment for each stock
- **Learning Hub** — Educational content for beginner traders
- **Rewards & Badges** — Daily quests, login streaks, and badge unlocks
- **Crowd Intelligence** — Community voting on stock directions

---

## 🌐 Live Repository

[https://github.com/rayyanshk03/GAME-athon](https://github.com/rayyanshk03/GAME-athon)
