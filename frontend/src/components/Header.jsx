import { useGamification } from '../context/GamificationContext';
import { useTheme } from '../context/ThemeContext';
import ConnectionStatus from './ConnectionStatus';

export default function Header({ activeTab, setActiveTab }) {
  const { points, loginStreak, badges } = useGamification();
  const { theme, toggle } = useTheme();

  const tabs = [
    { id: 'dashboard',  label: '📊 Dashboard'    },
    { id: 'portfolio',  label: '💼 Portfolio'     },
    { id: 'ai',         label: '🤖 AI Insights'  },
    { id: 'learning',   label: '📚 Learning'      },
    { id: 'crowd',      label: '🌐 Crowd Intel'   },
    { id: 'rewards',    label: '🏆 Rewards'       },
  ];

  return (
    <header className="app-header">
      <div className="header-brand">
        <span className="brand-logo">⚡</span>
        <span className="brand-name">StockQuest</span>
      </div>

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
