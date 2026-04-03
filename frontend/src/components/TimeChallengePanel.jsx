/**
 * TriviaPanel.jsx  (was TimeChallengePanel.jsx)
 *
 * Placed on the Learning page next to LearningHub.
 *
 * Gameplay:
 *   - Pulls a random multiple-choice question from QUIZ_QUESTIONS
 *   - Timer counts down 60 seconds per question
 *   - A question auto-spawns at 12:00 PM local time (once per day)
 *   - Manual "New Trivia" button is ONLY shown when the 12PM window is active
 *   - Outside 12PM window, the panel shows the next spawn countdown
 *   - A pulsing "Live" badge appears during the 12PM window
 *
 * 12PM window = 12:00:00 → 12:59:59 local time
 */

import { useState, useEffect, useRef } from 'react';
import { QUIZ_QUESTIONS } from '../api/staticData';
import { useGamification } from '../context/GamificationContext';

// ── Helpers ───────────────────────────────────────────────────────────────────
const SPAWN_KEY   = 'sq_trivia_spawn_date'; // localStorage key for last-spawn date
const WINDOW_HOUR = 12;                      // 12 PM local time
const REWARD_CORRECT = 25;
const REWARD_FAST    = 15; // bonus for answering in < 15 seconds

function getTodayStr() {
  return new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
}

function isInWindow() {
  return new Date().getHours() === WINDOW_HOUR;
}

function hasSpawnedToday() {
  return localStorage.getItem(SPAWN_KEY) === getTodayStr();
}

function markSpawnedToday() {
  localStorage.setItem(SPAWN_KEY, getTodayStr());
}

/** Flatten all questions from every category into one pool */
function buildQuestionPool() {
  return Object.entries(QUIZ_QUESTIONS).flatMap(([category, qs]) =>
    qs.map(q => ({ ...q, category }))
  );
}

function pickRandom(pool) {
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Seconds until next 12:00:00 */
function secondsUntilNoon() {
  const now  = new Date();
  const noon = new Date(now);
  noon.setHours(WINDOW_HOUR, 0, 0, 0);
  if (noon <= now) noon.setDate(noon.getDate() + 1);
  return Math.floor((noon - now) / 1000);
}

function formatCountdown(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return h > 0
    ? `${h}h ${String(m).padStart(2, '0')}m`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ── Category display helpers ──────────────────────────────────────────────────
const CATEGORY_META = {
  rsi:       { label: 'RSI',             color: '#3B82F6', emoji: '📊' },
  ma:        { label: 'Moving Averages', color: '#8B5CF6', emoji: '📈' },
  volume:    { label: 'Volume',          color: '#F59E0B', emoji: '📉' },
  sentiment: { label: 'Sentiment',       color: '#EC4899', emoji: '🧠' },
  risk:      { label: 'Risk Mgmt',       color: '#EF4444', emoji: '🛡️' },
  options:   { label: 'Options',         color: '#10B981', emoji: '🎯' },
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function TriviaPanel() {
  const { earnPoints, advanceQuest } = useGamification();
  const pool = useRef(buildQuestionPool());

  // Active question state
  const [question,   setQuestion]  = useState(null);
  const [selected,   setSelected]  = useState(null);   // chosen answer index
  const [revealed,   setRevealed]  = useState(false);  // show correct/wrong
  const [timeLeft,   setTimeLeft]  = useState(60);     // seconds for question
  const [streak,     setStreak]    = useState(0);

  // Global clock state
  const [clockSecs,  setClockSecs] = useState(0);      // seconds until noon
  const [inWindow,   setInWindow]  = useState(isInWindow);

  // ── 1-second global clock tick ────────────────────────────────────────────
  useEffect(() => {
    function tick() {
      const nowInWindow = isInWindow();
      setInWindow(nowInWindow);
      setClockSecs(nowInWindow ? 0 : secondsUntilNoon());

      // Auto-spawn at 12:00:00 exactly — once per day
      if (nowInWindow && !hasSpawnedToday() && !question) {
        spawnQuestion();
        markSpawnedToday();
      }
    }
    tick(); // run immediately
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [question]); // eslint-disable-line

  // ── Per-question countdown ────────────────────────────────────────────────
  useEffect(() => {
    if (!question || revealed) return;
    if (timeLeft <= 0) {
      setRevealed(true);
      setStreak(0);
      return;
    }
    const id = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [question, revealed, timeLeft]);

  // ── Actions ───────────────────────────────────────────────────────────────
  function spawnQuestion() {
    setQuestion(pickRandom(pool.current));
    setSelected(null);
    setRevealed(false);
    setTimeLeft(60);
  }

  function handleAnswer(idx) {
    if (revealed || selected !== null) return;
    setSelected(idx);
    setRevealed(true);

    const correct = idx === question.answer;
    if (correct) {
      const fast  = timeLeft > 45; // answered in < 15 s
      const pts   = REWARD_CORRECT + (fast ? REWARD_FAST : 0);
      earnPoints(pts);
      if (advanceQuest) advanceQuest('timed_win');
      setStreak(s => s + 1);
    } else {
      setStreak(0);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const catMeta = question ? (CATEGORY_META[question.category] ?? { label: question.category, color: '#6366f1', emoji: '❓' }) : null;

  return (
    <div className="panel challenge-panel" id="trivia-panel" style={{ position: 'relative' }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="panel-header" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
        <h2 className="panel-title" style={{ margin: 0 }}>🧩 Daily Trivia</h2>

        {/* Live badge — pulses only inside 12PM window */}
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
          fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.07em',
          padding: '0.2rem 0.55rem', borderRadius: '20px',
          background: inWindow ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
          color: inWindow ? '#22c55e' : 'var(--muted)',
          border: `1px solid ${inWindow ? '#22c55e55' : 'var(--border)'}`,
          animation: inWindow ? 'pulse-live 2s ease-in-out infinite' : 'none',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: inWindow ? '#22c55e' : 'var(--muted)',
            display: 'inline-block',
          }} />
          {inWindow ? 'LIVE' : 'OFFLINE'}
        </span>

        {/* Streak indicator */}
        {streak > 0 && (
          <span style={{
            fontSize: '0.72rem', fontWeight: 700,
            color: '#f59e0b', padding: '0.2rem 0.5rem',
            background: 'rgba(245,158,11,0.12)', borderRadius: '20px',
          }}>
            🔥 {streak} streak
          </span>
        )}

        {/* Manual "New Trivia" button — only during 12PM window */}
        {inWindow && (
          <button
            id="new-trivia-btn"
            className="btn-primary"
            onClick={() => { spawnQuestion(); markSpawnedToday(); }}
            style={{ marginLeft: 'auto', fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}
          >
            🎲 New Trivia
          </button>
        )}
      </div>

      {/* ── No active question ────────────────────────────────────────── */}
      {!question && (
        <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
          {inWindow ? (
            <>
              <p style={{ fontSize: '1.5rem', margin: '0 0 0.5rem' }}>🎲</p>
              <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                The 12 PM trivia window is open!<br />
                Click <strong>New Trivia</strong> to start a challenge.
              </p>
            </>
          ) : (
            <>
              <p style={{ fontSize: '1.8rem', margin: '0 0 0.5rem' }}>⏰</p>
              <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                Next trivia spawns at <strong>12:00 PM</strong>
              </p>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums', margin: 0 }}>
                {formatCountdown(clockSecs)}
              </p>
              <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
                Come back then to earn bonus points!
              </p>
            </>
          )}
        </div>
      )}

      {/* ── Active question ───────────────────────────────────────────── */}
      {question && (
        <div style={{ marginTop: '1rem' }}>

          {/* Category badge + timer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
            <span style={{
              fontSize: '0.72rem', fontWeight: 700,
              color: catMeta.color, background: catMeta.color + '1a',
              border: `1px solid ${catMeta.color}44`,
              padding: '0.2rem 0.55rem', borderRadius: '20px',
            }}>
              {catMeta.emoji} {catMeta.label}
            </span>
            <span style={{
              fontSize: '0.85rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums',
              color: timeLeft < 10 ? '#ef4444' : timeLeft < 30 ? '#f59e0b' : 'var(--muted)',
            }}>
              ⏱ {String(timeLeft).padStart(2, '0')}s
            </span>
          </div>

          {/* Timer progress bar */}
          <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, marginBottom: '0.9rem' }}>
            <div style={{
              height: '100%', borderRadius: 2,
              width: `${(timeLeft / 60) * 100}%`,
              background: timeLeft < 10 ? '#ef4444' : timeLeft < 30 ? '#f59e0b' : '#3B82F6',
              transition: 'width 1s linear, background 0.3s',
            }} />
          </div>

          {/* Question text */}
          <p style={{
            fontWeight: 600, fontSize: '0.92rem', color: 'var(--text)',
            marginBottom: '0.85rem', lineHeight: 1.4,
            whiteSpace: 'pre-line',
          }}>
            {question.q}
          </p>

          {/* Answer options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {question.options.map((opt, idx) => {
              let bg = 'rgba(255,255,255,0.04)';
              let border = 'var(--border)';
              let color  = 'var(--text)';

              if (revealed) {
                if (idx === question.answer) {
                  bg = 'rgba(34,197,94,0.12)'; border = '#22c55e'; color = '#22c55e';
                } else if (idx === selected && idx !== question.answer) {
                  bg = 'rgba(239,68,68,0.12)';  border = '#ef4444'; color = '#ef4444';
                } else {
                  bg = 'rgba(255,255,255,0.02)'; color = 'var(--muted)';
                }
              } else if (selected === idx) {
                bg = 'rgba(99,102,241,0.15)'; border = '#6366f1';
              }

              return (
                <button
                  key={idx}
                  id={`trivia-opt-${idx}`}
                  onClick={() => handleAnswer(idx)}
                  disabled={revealed}
                  style={{
                    background: bg, border: `1px solid ${border}`,
                    borderRadius: '8px', padding: '0.6rem 0.85rem',
                    textAlign: 'left', fontSize: '0.86rem', color,
                    cursor: revealed ? 'default' : 'pointer',
                    transition: 'all 0.2s', fontWeight: selected === idx || (revealed && idx === question.answer) ? 600 : 400,
                  }}
                >
                  {String.fromCharCode(65 + idx)}. {opt}
                  {revealed && idx === question.answer && ' ✓'}
                  {revealed && idx === selected && idx !== question.answer && ' ✗'}
                </button>
              );
            })}
          </div>

          {/* Result feedback */}
          {revealed && (
            <div style={{
              marginTop: '0.85rem',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              background: selected === question.answer
                ? 'rgba(34,197,94,0.1)' : timeLeft <= 0
                ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${selected === question.answer ? '#22c55e44' : timeLeft <= 0 ? '#f59e0b44' : '#ef444444'}`,
            }}>
              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600,
                color: selected === question.answer ? '#22c55e' : timeLeft <= 0 ? '#f59e0b' : '#ef4444' }}>
                {timeLeft <= 0 && selected === null
                  ? `⌛ Time's up! The answer was: ${question.options[question.answer]}`
                  : selected === question.answer
                  ? `✅ Correct! +${REWARD_CORRECT}${timeLeft > 45 ? ` +${REWARD_FAST} speed bonus` : ''} pts`
                  : `❌ Incorrect. The answer was: ${question.options[question.answer]}`}
              </p>
            </div>
          )}

          {/* Next question button */}
          {revealed && (
            <button
              id="next-trivia-btn"
              className="btn-secondary"
              onClick={spawnQuestion}
              style={{ marginTop: '0.75rem', width: '100%' }}
            >
              Next Question →
            </button>
          )}
        </div>
      )}

      {/* Pulse animation style */}
      <style>{`
        @keyframes pulse-live {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.55; }
        }
      `}</style>
    </div>
  );
}
