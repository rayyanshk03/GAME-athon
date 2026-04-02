import { useState } from 'react';
import Header from './components/Header';
import StockDashboard from './components/StockDashboard';
import PortfolioTracker from './components/PortfolioTracker';
import Leaderboard from './components/Leaderboard';
import TradeExplainer from './components/TradeExplainer';
import LearningHub from './components/LearningHub';
import CrowdIntelligenceDashboard from './components/CrowdIntelligenceDashboard';
import SimulationModeSelector from './components/SimulationModeSelector';
import TimeChallengePanel from './components/TimeChallengePanel';
import RewardsDashboard from './components/RewardsDashboard';
import HallOfFame from './components/HallOfFame';
import SocialHub from './components/SocialHub';
import FlashContestRoom from './components/FlashContestRoom';
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
        {activeTab === 'learning' && <LearningHub />}
        {activeTab === 'crowd' && (
          <div className="crowd-layout">
            <SimulationModeSelector />
            <div className="two-col">
              <TimeChallengePanel />
              <FlashContestRoom />
            </div>
            <CrowdIntelligenceDashboard />
          </div>
        )}
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
