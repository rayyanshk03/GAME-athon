import { useEffect } from 'react';
import { useGamification } from '../context/GamificationContext';

export default function OutcomeNotification() {
  const { notifications, dismissNotif } = useGamification();

  useEffect(() => {
    if (!notifications.length) return;
    const timer = setTimeout(() => dismissNotif(notifications[0].id), 5000);
    return () => clearTimeout(timer);
  }, [notifications, dismissNotif]);

  if (!notifications.length) return null;
  const n = notifications[0];

  return (
    <div className={`toast toast-${n.type}`} id="outcome-toast">
      <div className="toast-icon">{n.badge?.icon || (n.won ? '📈' : '📉')}</div>
      <div className="toast-body">
        <div className="toast-title">
          {n.type === 'badge' ? `Badge Unlocked: ${n.badge.name}` : n.won ? 'Trade Won! 🎉' : 'Trade Lost'}
        </div>
        <div className="toast-sub">
          {n.type === 'badge' ? n.badge.desc : `${n.pointDelta > 0 ? '+' : ''}${n.pointDelta} points`}
        </div>
      </div>
      <button className="toast-close" onClick={() => dismissNotif(n.id)}>✕</button>
    </div>
  );
}
