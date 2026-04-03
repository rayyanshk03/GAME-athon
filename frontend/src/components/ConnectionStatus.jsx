import { useState, useEffect } from 'react';
import { getConnectionStatus } from '../api/apiClient';
import { useData } from '../context/StockDataContext';

export default function ConnectionStatus() {
  const [status, setStatus] = useState(null);
  const { secondsLeft, lastUpdated } = useData() || {};

  useEffect(() => {
    getConnectionStatus().then(setStatus);
    const interval = setInterval(() => getConnectionStatus().then(setStatus), 30000);
    return () => clearInterval(interval);
  }, []);

  const mins = Math.floor((secondsLeft ?? 60) / 60);
  const secs = String((secondsLeft ?? 60) % 60).padStart(2, '0');
  const isRefreshing = (secondsLeft ?? 60) === 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      {/* Live NSE badge */}
      <div className="live-nse-badge" title="Indian NSE stocks — live prices">
        <span className="live-dot" />
        <span>NSE LIVE</span>
      </div>

      {/* Countdown */}
      <div
        className={`refresh-countdown ${isRefreshing ? 'refreshing' : ''}`}
        title={lastUpdated ? `Last updated: ${new Date(lastUpdated).toLocaleTimeString()}` : 'Waiting for data...'}
      >
        {isRefreshing ? '🔄 Updating…' : `⏱ ${mins}:${secs}`}
      </div>

      {/* API status */}
      {status && (
        <div
          id="connection-status"
          className={`connection-pill ${status.backendOnline ? 'online' : 'offline'}`}
          title={status.message}
        >
          <span className="conn-dot" />
          <span className="conn-label">
            {status.backendOnline ? 'API Online' : 'Local Mode'}
          </span>
        </div>
      )}
    </div>
  );
}
