import { useState, useEffect } from 'react';
import { getConnectionStatus } from '../services/ApiService';

/**
 * ConnectionStatus — shows a small pill in the header indicating
 * whether the Express backend is online or offline.
 * When offline, the app continues to work using local fallbacks.
 */
export default function ConnectionStatus() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    getConnectionStatus().then(setStatus);
    // Re-check every 30 seconds
    const interval = setInterval(() => getConnectionStatus().then(setStatus), 30000);
    return () => clearInterval(interval);
  }, []);

  if (!status) return null;

  return (
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
  );
}
