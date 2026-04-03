import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { GamificationProvider } from './context/GamificationContext';
import { PortfolioProvider } from './context/PortfolioContext';
import { CrowdIntelligenceProvider } from './context/CrowdIntelligenceContext';
import { StockDataProvider } from './context/StockDataContext';
import { VirtualPortfolioProvider } from './context/VirtualPortfolioContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <GamificationProvider>
        <PortfolioProvider>
          <StockDataProvider>
            <VirtualPortfolioProvider>
              <CrowdIntelligenceProvider>
                <App />
              </CrowdIntelligenceProvider>
            </VirtualPortfolioProvider>
          </StockDataProvider>
        </PortfolioProvider>
      </GamificationProvider>
    </ThemeProvider>
  </React.StrictMode>
);
