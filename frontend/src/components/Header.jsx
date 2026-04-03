import { useGamification } from '../context/GamificationContext';
import { useTheme } from '../context/ThemeContext';
import ConnectionStatus from './ConnectionStatus';
import { useState } from 'react';

export default function Header({ activeTab, setActiveTab, user, onLogout, tvSymbol, onSymbolChange }) {
  const { points, loginStreak, badges } = useGamification();
  const { theme, toggle } = useTheme();
  const [searchInput, setSearchInput] = useState('');

  const tabs = [
    { id: 'dashboard',  label: 'Dashboard'          },
    { id: 'virtual',    label: '💼 Virtual Portfolio' },
    { id: 'portfolio',  label: 'Portfolio'           },
    { id: 'ai',         label: 'AI Insights'         },
    { id: 'learning',   label: 'Learning'            },
    { id: 'crowd',      label: 'Crowd Intel'         },
    { id: 'rewards',    label: 'Rewards'             },
  ];

  function handleSymbolSearch(e) {
    e.preventDefault();
    const raw = searchInput.trim().toUpperCase();
    if (!raw) return;
    let sym;
    if (raw.includes(':')) {
      sym = raw; // e.g. NASDAQ:AAPL — keep as-is
    } else {
      // Strip Yahoo exchange suffixes if user pasted them
      const clean = raw.replace(/\.(NS|BO|BSE|L|AX|TO|HK|SI|KS)$/i, '');
      sym = `NSE:${clean}`;
    }
    onSymbolChange?.(sym);
    setActiveTab('dashboard');
    setSearchInput('');
  }

  return (
    <header className="app-header">
      <div className="header-brand">
        <span className="brand-logo">⚡</span>
        <span className="brand-name">StockQuest</span>
      </div>

      {/* ── Symbol Search ─────────────────────────────────────────────── */}
      <form className="tv-symbol-search" onSubmit={handleSymbolSearch} role="search">
        <span className="tv-search-icon">🔍</span>
        <input
          id="tv-symbol-input"
          type="text"
          className="tv-search-input"
          placeholder={tvSymbol || 'NSE:RELIANCE'}
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          aria-label="Search stock symbol"
          autoComplete="off"
          spellCheck={false}
        />
        <button type="submit" className="tv-search-btn" aria-label="Go">Go</button>
      </form>

      <nav className="header-nav">
        {tabs.map(t => (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            className={`nav-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >{t.label}</button>
        ))}
      </nav>

      <div className="header-meta">
        <ConnectionStatus />

        <div className="user-profile-header">
          <span className="user-name-tag">{user?.username || 'Guest'}</span>
          <button className="logout-btn" onClick={onLogout} title="Logout">🚪</button>
        </div>

        <div className="points-badge">
          <span className="points-icon">🪙</span>
          <span className="points-value">{points.toLocaleString()}</span>
          <span className="points-label">pts</span>
        </div>
        {loginStreak > 0 && (
          <div className="streak-badge" title={`${loginStreak}-day streak`}>
            🔥 {loginStreak}
          </div>
        )}
        <div className="badge-count" title={`${badges.length} badges earned`}>
          🎖️ {badges.length}
        </div>
        <button id="theme-toggle-btn" className="theme-toggle" onClick={toggle} title="Toggle theme">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  );
}
