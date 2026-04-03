import { useState } from 'react';
import Header from './components/Header';
import StockDashboard from './components/StockDashboard';
import PortfolioTracker from './components/PortfolioTracker';
import Leaderboard from './components/Leaderboard';
import TradeExplainer from './components/TradeExplainer';
import LearningHub from './components/LearningHub';
import CrowdIntelligenceDashboard from './components/CrowdIntelligenceDashboard';
import TimeChallengePanel from './components/TimeChallengePanel';
import RewardsDashboard from './components/RewardsDashboard';
import HallOfFame from './components/HallOfFame';
import SocialHub from './components/SocialHub';
import AIChatBot from './components/AIChatBot';
import OutcomeNotification from './components/OutcomeNotification';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="app-root">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="app-main">
        {activeTab === 'dashboard' && <StockDashboard />}

        {activeTab === 'portfolio' && (
          <div className="two-col">
            <PortfolioTracker />
            <div className="portfolio-right">
              <Leaderboard />
              <SocialHub />
            </div>
          </div>
        )}

        {activeTab === 'ai' && <TradeExplainer />}

        {/* Learning page — LearningHub + TriviaPanel side by side */}
        {activeTab === 'learning' && (
          <div className="two-col" style={{ alignItems: 'flex-start' }}>
            <LearningHub />
            <div style={{ minWidth: 0, flex: '0 0 340px', maxWidth: 380 }}>
              <TimeChallengePanel />
            </div>
          </div>
        )}

        {/* People page — simplified community voting only */}
        {activeTab === 'crowd' && <CrowdIntelligenceDashboard />}

        {activeTab === 'rewards' && (
          <div className="rewards-layout">
            <RewardsDashboard />
            <HallOfFame />
          </div>
        )}
      </main>
      <AIChatBot />
      <OutcomeNotification />
    </div>
  );
}
