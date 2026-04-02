/**
 * RewardsEngine.js — Module D
 * Badge unlocks, streaks, daily login, and quest generation. Pure functions.
 */

export const BADGES = {
  FIRST_PROFIT:  { id: 'first_profit',  name: 'First Profit',     icon: '💰', rarity: 'common',    desc: 'Win your first trade.' },
  MARKET_GURU:   { id: 'market_guru',   name: 'Market Guru',      icon: '🧙', rarity: 'rare',      desc: 'Win 10 trades total.' },
  RISK_MASTER:   { id: 'risk_master',   name: 'Risk Master',      icon: '🎯', rarity: 'rare',      desc: 'Win 3 trades with 3x multiplier.' },
  STREAK_KING:   { id: 'streak_king',   name: 'Streak King',      icon: '🔥', rarity: 'epic',      desc: '7-day login streak.' },
  DIVERSIFIED:   { id: 'diversified',   name: 'Diversified',      icon: '🌈', rarity: 'uncommon',  desc: 'Bet on 5 different stocks.' },
  POINT_HUNTER:  { id: 'point_hunter',  name: 'Point Hunter',     icon: '👑', rarity: 'epic',      desc: 'Reach 2,000 points.' },
  TEN_STREAK:    { id: 'ten_streak',    name: '10-Win Streak',    icon: '⚡', rarity: 'legendary', desc: 'Win 10 trades in a row.' },
  MILLIONAIRE:   { id: 'millionaire',   name: 'Point Millionaire',icon: '💎', rarity: 'legendary', desc: '1,000,000 lifetime points.' },
};

const QUEST_POOL = [
  { id: 'q1', title: 'Win 2 trades today',           type: 'wins',        target: 2,  reward: 25 },
  { id: 'q2', title: 'Place 3 trades',               type: 'trades',      target: 3,  reward: 15 },
  { id: 'q3', title: 'Use a 2x multiplier',          type: 'multiplier',  target: 1,  reward: 20 },
  { id: 'q4', title: 'Invest in a tech stock',       type: 'sector',      target: 1,  reward: 15, sector: 'Technology' },
  { id: 'q5', title: 'Win a timed bet',              type: 'timed_win',   target: 1,  reward: 30 },
  { id: 'q6', title: 'Vote in crowd intelligence',   type: 'vote',        target: 1,  reward: 10 },
  { id: 'q7', title: 'Complete a learning quiz',     type: 'quiz',        target: 1,  reward: 20 },
  { id: 'q8', title: 'Earn 50 pts in one trade',     type: 'single_earn', target: 50, reward: 35 },
];

export function checkDailyLogin(lastLoginTs) {
  const dayMs = 864e5;
  const elapsed = Date.now() - (lastLoginTs || 0);
  if (elapsed < dayMs) return { newLogin: false };
  return { newLogin: true, streakContinued: elapsed < 2 * dayMs, points: 10 };
}

export function getStreakBonus(streak) {
  if (streak >= 30) return 100;
  if (streak >= 14) return 50;
  if (streak >= 7)  return 25;
  return 0;
}

export function checkBadgeUnlocks(stats, currentBadgeIds = []) {
  const has = id => currentBadgeIds.includes(id);
  const newBadges = [];
  if (!has('first_profit') && stats.totalWins >= 1)          newBadges.push(BADGES.FIRST_PROFIT);
  if (!has('market_guru')  && stats.totalWins >= 10)         newBadges.push(BADGES.MARKET_GURU);
  if (!has('risk_master')  && stats.tripleWins >= 3)         newBadges.push(BADGES.RISK_MASTER);
  if (!has('streak_king')  && stats.loginStreak >= 7)        newBadges.push(BADGES.STREAK_KING);
  if (!has('diversified')  && stats.uniqueStocks >= 5)       newBadges.push(BADGES.DIVERSIFIED);
  if (!has('point_hunter') && stats.totalPoints >= 2000)     newBadges.push(BADGES.POINT_HUNTER);
  if (!has('ten_streak')   && stats.winStreak >= 10)         newBadges.push(BADGES.TEN_STREAK);
  if (!has('millionaire')  && stats.lifetimePoints >= 1e6)   newBadges.push(BADGES.MILLIONAIRE);
  return newBadges;
}

export function generateDailyQuests() {
  const today = new Date().toDateString();
  const seed = today.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const shuffled = [...QUEST_POOL].sort((a, b) => ((seed * parseInt(a.id[1])) % 7) - 3);
  return shuffled.slice(0, 3).map(q => ({ ...q, progress: 0, completed: false }));
}

export function updateQuestProgress(quests, eventType, value = 1) {
  return quests.map(q => {
    if (q.completed || q.type !== eventType) return q;
    const progress = Math.min(q.progress + value, q.target);
    return { ...q, progress, completed: progress >= q.target };
  });
}
