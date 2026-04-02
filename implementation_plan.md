# Implement Module C: Core Dashboard UI

The goal is to design and develop Module C (Core Dashboard UI) of the StockQuest platform. Based on the provided flowchart, this module acts as the Frontend that consumes outputs from Data and AI layers, and specifically involves creating three distinct visual components:
1. **Stock Chart View**: A charting interface displaying stock trends, RSI, Moving Averages (MA), and volume graphs.
2. **Sentiment Panel**: A UI to visualize news sentiment (Positive / Negative / Neutral).
3. **AI Insights Panel**: A panel to showcase AI-driven recommendations, alerts, and personalized tips.

This prototype will be built with React and Vite. As requested by the systemic instructions, we will focus aggressively on a visually stunning, premium aesthetic using pure Vanilla CSS, featuring a modern dark-mode color palette, smooth gradients, glassmorphism, and micro-animations to keep the user engaged.

## User Review Required
> [!IMPORTANT]
> The project will use Vanilla CSS rather than Tailwind, ensuring highly customized and premium animations and styles. React (via Vite) will be used for the component architecture. Let me know if you would like me to use a specific charting library (for example, Recharts or TradingView's Lightweight Charts) to draw the stock indicators, otherwise I will use `recharts` for React.

## Proposed Changes

### Configuration
#### [NEW] package.json
Initialize a Next-gen React app using Vite (`npx create-vite`) with necessary dependencies like `recharts` for the Stock Chart view, `lucide-react` for premium iconography.

### Core Styles
#### [NEW] index.css
Will define a premium dark-mode theme, glassmorphism utility classes, animations, and CSS custom properties (variables) for consistent branding.

### Components
#### [NEW] App.jsx
The main layout container establishing a CSS Grid or Flexbox structure to house the Dashboard panels.
#### [NEW] StockChartView.jsx
A dynamic chart component integrating price, volume, and technical indicators (RSI, MA).
#### [NEW] SentimentPanel.jsx
A visual breakdown of market sentiment based on news, using color-coded gauges or progress bars.
#### [NEW] AiInsightsPanel.jsx
A sleek, card-based interface detailing AI-driven actionable tips (e.g., "Positive momentum detected. Suggested action: Hold").

## Open Questions

> [!QUESTION]
> Since Modules A (Data) and B (AI) are built separately, I will use high-quality mock data to populate this dashboard prototype so you can see how it looks and feels. Is this approach acceptable to you for starting out?

## Verification Plan
### Automated Tests
- Scaffold the project and verify it compiles without errors via `npm run dev`.
### Manual Verification
- Render the UI in a local development server and interact with the elements to ensure the layout is responsive, animations work properly, and the premium look-and-feel is achieved.
