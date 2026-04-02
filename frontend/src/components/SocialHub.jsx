import { useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { useGamification } from '../context/GamificationContext';
import { STOCKS } from '../data/mockData';

export default function SocialHub() {
  const { friends, leagues, addFriend, createLeague, tradeHistory, winRate, reputationScore } = usePortfolio();
  const { points, badges } = useGamification();

  const [tab, setTab]               = useState('battles');
  const [friendName, setFriendName] = useState('');
  const [leagueName, setLeagueName] = useState('');
  const [battleStock, setBattleStock] = useState(STOCKS[0].symbol);
  const [battleDuration, setBattleDuration] = useState('1h');
  const [battleStake, setBattleStake] = useState('');
  const [sentInvites, setSentInvites] = useState([]);
  const [shareVisible, setShareVisible] = useState(false);

  function sendBattleInvite() {
    if (!battleStake) return;
    const invite = {
      id: Date.now(),
      stock: battleStock,
      duration: battleDuration,
      stake: Number(battleStake),
      sentAt: new Date().toLocaleTimeString(),
      opponent: friends[Math.floor(Math.random() * friends.length)]?.name || 'Open Invite',
      status: 'pending',
    };
    setSentInvites(prev => [invite, ...prev]);
    setBattleStake('');
  }

  function handleAddFriend() {
    if (!friendName.trim()) return;
    addFriend({ name: friendName.trim(), online: Math.random() > 0.5, points: Math.floor(Math.random() * 5000 + 500) });
    setFriendName('');
  }

  function handleCreateLeague() {
    if (!leagueName.trim()) return;
    createLeague({ name: leagueName.trim(), createdAt: Date.now() });
    setLeagueName('');
  }

  // Best trade for share card
  const bestTrade = [...tradeHistory].sort((a, b) => b.pointDelta - a.pointDelta)[0];

  return (
    <div className="panel social-hub" id="social-hub">
      <div className="panel-header">
        <h2 className="panel-title">🤝 Social Hub</h2>
        <div className="view-tabs">
          {['battles', 'leagues', 'friends', 'share'].map(t => (
            <button key={t} id={`social-tab-${t}`} className={`filter-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t === 'battles' ? '🥊 Battles' : t === 'leagues' ? '🏟️ Leagues' : t === 'friends' ? '👥 Friends' : '📤 Share'}
            </button>
          ))}
        </div>
      </div>

      {/* ── 1v1 Battles ───────────────────────────────────── */}
      {tab === 'battles' && (
        <div className="social-section">
          <p className="social-desc">Challenge a friend to trade the same stock — highest % gain wins!</p>
          <div className="battle-form">
            <div className="form-group">
              <label>Stock</label>
              <select id="battle-stock" value={battleStock} onChange={e => setBattleStock(e.target.value)}>
                {STOCKS.map(s => <option key={s.symbol} value={s.symbol}>{s.symbol} — ${s.price}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Duration</label>
              <div className="duration-row">
                {['1h', '12h', '1d'].map(d => (
                  <button key={d} id={`battle-dur-${d}`} className={`dur-btn ${battleDuration === d ? 'active' : ''}`} onClick={() => setBattleDuration(d)}>{d}</button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Stake (pts)</label>
              <input id="battle-stake" type="number" min="10" value={battleStake} onChange={e => setBattleStake(e.target.value)} placeholder="Points to stake…" />
            </div>
            <button id="send-battle-btn" className="btn-primary" onClick={sendBattleInvite} disabled={!battleStake}>
              🥊 Send Battle Invite
            </button>
          </div>

          {sentInvites.length > 0 && (
            <div className="invites-list">
              <h3 className="sub-title">Sent Invites</h3>
              {sentInvites.map(inv => (
                <div key={inv.id} className="invite-card">
                  <div className="invite-info">
                    <span className="invite-stock">{inv.stock}</span>
                    <span className="invite-dur">{inv.duration}</span>
                    <span className="invite-stake">{inv.stake} pts</span>
                    <span className="invite-opponent">vs {inv.opponent}</span>
                  </div>
                  <span className={`invite-status status-${inv.status}`}>{inv.status}</span>
                  <span className="invite-time">{inv.sentAt}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Private Leagues ───────────────────────────────── */}
      {tab === 'leagues' && (
        <div className="social-section">
          <p className="social-desc">Create a private league with friends and compete on a weekly leaderboard.</p>
          <div className="league-form">
            <div className="form-group">
              <label>League Name</label>
              <input id="league-name-input" type="text" value={leagueName} onChange={e => setLeagueName(e.target.value)} placeholder="e.g. BITS Traders Club" />
            </div>
            <button id="create-league-btn" className="btn-primary" onClick={handleCreateLeague} disabled={!leagueName.trim()}>
              🏟️ Create League
            </button>
          </div>
          {leagues.length === 0 ? (
            <p className="empty-state">No leagues yet. Create one above!</p>
          ) : (
            <div className="leagues-list">
              {leagues.map(l => (
                <div key={l.id} className="league-card">
                  <div className="league-icon">🏟️</div>
                  <div className="league-info">
                    <div className="league-name">{l.name}</div>
                    <div className="league-meta">{l.members?.length || 0} members · Created {new Date(l.createdAt).toLocaleDateString()}</div>
                  </div>
                  <button className="btn-secondary" style={{ width: 'auto' }}>Invite</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Friends ───────────────────────────────────────── */}
      {tab === 'friends' && (
        <div className="social-section">
          <div className="add-friend-form">
            <input id="friend-name-input" type="text" value={friendName} onChange={e => setFriendName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddFriend()}
              placeholder="Enter friend's username…" />
            <button id="add-friend-btn" className="btn-primary" style={{ width: 'auto' }} onClick={handleAddFriend}>Add</button>
          </div>
          {friends.length === 0 ? (
            <p className="empty-state">No friends added yet. Add a username above!</p>
          ) : (
            <div className="friends-list">
              {friends.map((f, i) => (
                <div key={i} className="friend-card">
                  <div className="friend-avatar">{f.name[0].toUpperCase()}</div>
                  <div className="friend-info">
                    <div className="friend-name">{f.name}</div>
                    <div className="friend-pts">{f.points?.toLocaleString()} pts</div>
                  </div>
                  <div className={`online-dot ${f.online ? 'online' : 'offline'}`} title={f.online ? 'Online' : 'Offline'} />
                  <button className="btn-secondary" id={`battle-${f.name}`} style={{ width: 'auto', fontSize: '.75rem', padding: '.3rem .6rem' }}
                    onClick={() => { setTab('battles'); }}>🥊 Battle</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Share Card ────────────────────────────────────── */}
      {tab === 'share' && (
        <div className="social-section">
          <p className="social-desc">Share your trading performance like Spotify Wrapped!</p>
          <div className="share-card" id="portfolio-share-card">
            <div className="share-card-header">
              <span className="share-logo">⚡ StockQuest</span>
              <span className="share-week">This Week</span>
            </div>
            <div className="share-stats">
              <div className="share-stat"><span className="share-val">{points.toLocaleString()}</span><span>Points</span></div>
              <div className="share-stat"><span className="share-val">{winRate ?? 0}%</span><span>Win Rate</span></div>
              <div className="share-stat"><span className="share-val">{reputationScore ?? 0}</span><span>Rep Score</span></div>
              <div className="share-stat"><span className="share-val">{badges.length}</span><span>Badges</span></div>
            </div>
            {bestTrade && (
              <div className="share-best">
                🏆 Best Trade: <strong>{bestTrade.symbol}</strong> +{bestTrade.pointDelta} pts
              </div>
            )}
            <div className="share-tagline">"Trading smarter, one quest at a time."</div>
          </div>
          <button id="copy-share-btn" className="btn-secondary" style={{ marginTop: '1rem' }}
            onClick={() => { navigator.clipboard?.writeText(`I'm on StockQuest! Win Rate: ${winRate}% | ${points} pts | Rep: ${reputationScore}`); alert('Stats copied to clipboard! 📋'); }}>
            📋 Copy Stats to Clipboard
          </button>
        </div>
      )}
    </div>
  );
}
