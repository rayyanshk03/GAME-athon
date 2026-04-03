import { useState, useEffect } from 'react';
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
import VirtualPortfolio from './components/VirtualPortfolio';
import LoginPage from './components/LoginPage';
import TradingViewChart from './components/TradingViewChart';
import { getCurrentUser, logout } from './api/apiClient';

export default function App() {
  const [activeTab, setActiveTab]   = useState('dashboard');
  const [user, setUser]             = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [tvSymbol, setTvSymbol]     = useState('NSE:RELIANCE');

  useEffect(() => {
    async function initAuth() {
      const storedUser = await getCurrentUser();
      if (storedUser) setUser(storedUser);
      setIsInitializing(false);
    }
    initAuth();
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  if (isInitializing) {
    return (
      <div className="app-loading">
        <div className="spinner"></div>
        <p>Initializing StockQuest...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-root">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
        tvSymbol={tvSymbol}
        onSymbolChange={setTvSymbol}
      />
      <main className="app-main">
        {activeTab === 'dashboard' && (
          <StockDashboard tvSymbol={tvSymbol} onTvSymbolChange={setTvSymbol} />
        )}
        {activeTab === 'virtual'   && <VirtualPortfolio />}
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
