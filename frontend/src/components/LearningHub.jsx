import { useState, useEffect } from 'react';
import { LEARNING_MODULES, QUIZ_QUESTIONS } from '../api/staticData';
import { useGamification } from '../context/GamificationContext';

const STORAGE_KEY = 'sq_learning_progress';

function loadProgress() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
}
function saveProgress(p) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch {}
}

// ── Difficulty colour map ─────────────────────────────────────────────────────
const DIFF_COLORS = {
  Beginner:     { bg: 'rgba(34,197,94,0.12)',   text: '#22c55e',   border: '#22c55e44' },
  Intermediate: { bg: 'rgba(245,158,11,0.12)',  text: '#f59e0b',   border: '#f59e0b44' },
  Hard:         { bg: 'rgba(239,68,68,0.12)',    text: '#ef4444',   border: '#ef444444' },
};

export default function LearningHub() {
  const { earnPoints, advanceQuest } = useGamification();

  const [progress,  setProgress]  = useState(loadProgress);
  const [lesson,    setLesson]    = useState(null);
  const [quiz,      setQuiz]      = useState(null);
  const [answers,   setAnswers]   = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [filter,    setFilter]    = useState('All'); // 'All' | 'Beginner' | 'Intermediate' | 'Hard'

  useEffect(() => saveProgress(progress), [progress]);

  // ── Lesson viewer ──────────────────────────────────────────────────────────
  function openLesson(mod) {
    const done = progress[mod.id] || 0;
    // If completed, we want 'Review' to start from the first lesson
    const idx = done >= mod.lessons.length ? 0 : done;
    setLesson({ mod, idx });
  }

  function completeLesson() {
    const { mod, idx } = lesson;
    const done = progress[mod.id] || 0;
    if (idx >= done) {
      const newDone = idx + 1;
      setProgress(p => ({ ...p, [mod.id]: newDone }));
      if (newDone === mod.lessons.length) earnPoints(mod.xpReward);
    }
    if (idx < mod.lessons.length - 1) {
      setLesson({ mod, idx: idx + 1 });
    } else {
      setLesson(null);
    }
  }

  function prevLesson() {
    if (lesson.idx > 0) setLesson(l => ({ ...l, idx: l.idx - 1 }));
  }

  // ── Quiz ───────────────────────────────────────────────────────────────────
  function startQuiz(mod) { setQuiz(mod); setAnswers({}); setSubmitted(false); }
  function closeQuiz()    { setQuiz(null); setSubmitted(false); }

  function handleAnswer(qi, ai) {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qi]: ai }));
  }

  function handleSubmit() {
    setSubmitted(true);
    const qs    = QUIZ_QUESTIONS[quiz.id] || [];
    const score = qs.reduce((s, q, i) => s + (answers[i] === q.answer ? 1 : 0), 0);
    const reward = score === qs.length ? 50 : score >= qs.length / 2 ? 20 : 0;
    if (reward) earnPoints(reward);
    if (advanceQuest) advanceQuest('quiz', 1);
  }

  const qs = quiz ? (QUIZ_QUESTIONS[quiz.id] || []) : [];

  // ── Filter ─────────────────────────────────────────────────────────────────
  const TIERS = ['All', 'Beginner', 'Intermediate', 'Hard'];
  const visibleModules = filter === 'All'
    ? LEARNING_MODULES
    : LEARNING_MODULES.filter(m => m.difficulty === filter);

  // ── Aggregate stats ────────────────────────────────────────────────────────
  const totalModules   = LEARNING_MODULES.length;
  const completedCount = LEARNING_MODULES.filter(m => (progress[m.id] || 0) >= m.lessons.length).length;
  const totalXP        = LEARNING_MODULES.reduce((s, m) =>
    s + (((progress[m.id] || 0) >= m.lessons.length) ? m.xpReward : 0), 0);

  return (
    <div className="learning-page" id="learning-hub">
      <h2 className="section-title">📚 Learning Hub</h2>

      {/* ── Progress summary ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {[
          { label: 'Modules Complete', value: `${completedCount}/${totalModules}`, color: '#22c55e' },
          { label: 'XP Earned',        value: `+${totalXP} pts`,                   color: '#6366f1' },
          { label: 'Questions Bank',   value: `${Object.values(QUIZ_QUESTIONS).flat().length} Q's`, color: '#f59e0b' },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '10px', padding: '0.6rem 1rem', flex: '1', minWidth: '110px',
          }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Tier filter ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '1.1rem', flexWrap: 'wrap' }}>
        {TIERS.map(t => {
          const dc = DIFF_COLORS[t];
          const active = filter === t;
          return (
            <button
              key={t}
              onClick={() => setFilter(t)}
              style={{
                padding: '0.3rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.78rem',
                fontWeight: 600,
                border: active ? (dc ? `1px solid ${dc.text}` : '1px solid #6366f1') : '1px solid var(--border)',
                background: active ? (dc ? dc.bg : 'rgba(99,102,241,0.12)') : 'transparent',
                color: active ? (dc ? dc.text : '#6366f1') : 'var(--muted)',
                cursor: 'pointer',
                transition: 'all 0.18s',
              }}
            >
              {t === 'All' ? '☰ All' : t}
            </button>
          );
        })}
      </div>

      {/* ── Module card grid ─────────────────────────────────────────── */}
      <div className="modules-grid">
        {visibleModules.map(mod => {
          const total = mod.lessons.length;
          const done  = Math.min(progress[mod.id] || 0, total);
          const pct   = Math.round((done / total) * 100);
          const full  = done === total;
          const dc    = DIFF_COLORS[mod.difficulty] ?? DIFF_COLORS['Beginner'];

          return (
            <div key={mod.id} className="module-card" id={`module-${mod.id}`}>
              <div className="module-icon">{mod.icon}</div>
              <div className="module-info">
                <div className="module-title">{mod.title}</div>
                <div className="module-meta">
                  <span style={{
                    fontSize: '0.68rem', fontWeight: 700,
                    padding: '0.15rem 0.45rem', borderRadius: '12px',
                    background: dc.bg, color: dc.text, border: `1px solid ${dc.border}`,
                  }}>
                    {mod.difficulty}
                  </span>
                  <span className="module-reward">+{mod.xpReward} pts</span>
                </div>
                <div className="module-progress-bar">
                  <div className="module-fill" style={{
                    width: `${pct}%`,
                    background: full ? '#10B981' : dc.text,
                  }} />
                </div>
                <div className="module-count">{done}/{total} lessons · {pct}%</div>
              </div>
              <div className="module-actions">
                <button className="btn-secondary" onClick={() => openLesson(mod)}>
                  {full ? '✅ Review' : done === 0 ? '▶ Start' : '▶ Continue'}
                </button>
                {QUIZ_QUESTIONS[mod.id] && (
                  <button id={`quiz-${mod.id}`} className="btn-primary" onClick={() => startQuiz(mod)}>
                    🧠 Quiz
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Lesson Viewer Modal ───────────────────────────────────────── */}
      {lesson && (() => {
        const { mod, idx } = lesson;
        const total  = mod.lessons.length;
        const ls     = mod.lessons[idx];
        const done   = progress[mod.id] || 0;
        const isDone = idx < done;
        const dc     = DIFF_COLORS[mod.difficulty] ?? DIFF_COLORS['Beginner'];
        const links  = mod.externalLinks ?? [];

        return (
          <div className="modal-overlay" id="lesson-modal"
            onClick={e => { if (e.target === e.currentTarget) setLesson(null); }}>
            <div className="modal-card" style={{ maxWidth: 620, width: '92%' }}>

              {/* Header */}
              <div className="modal-header">
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--muted)', display: 'block', marginBottom: 2 }}>
                    {mod.icon} {mod.title} — Lesson {idx + 1} of {total}
                  </span>
                  <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{ls.title}</h3>
                </div>
                <button className="modal-close" onClick={() => setLesson(null)}>✕</button>
              </div>

              {/* Progress bar */}
              <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, margin: '0.75rem 0' }}>
                <div style={{
                  height: '100%', borderRadius: 2, background: dc.text,
                  width: `${((idx + 1) / total) * 100}%`, transition: 'width 0.3s',
                }} />
              </div>

              {/* Lesson content */}
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '1.25rem',
                lineHeight: 1.75, fontSize: '0.9rem', color: 'var(--text)',
                minHeight: 120, marginBottom: '1rem',
              }}>
                {ls.content}
              </div>

              {/* ── Recommended Resources ──────────────────────────────── */}
              {links.length > 0 && (
                <div style={{
                  background: 'rgba(99,102,241,0.06)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: '10px', padding: '0.85rem 1rem',
                  marginBottom: '1rem',
                }}>
                  <p style={{ margin: '0 0 0.55rem', fontSize: '0.78rem', fontWeight: 700, color: '#6366f1', letterSpacing: '0.04em' }}>
                    🔗 RECOMMENDED RESOURCES
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {links.map((link, i) => (
                      <a
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: '0.83rem', color: '#818cf8',
                          textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem',
                        }}
                        onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                      >
                        <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>↗</span>
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Already completed */}
              {isDone && (
                <p style={{ fontSize: '0.78rem', color: '#10B981', marginBottom: '0.75rem' }}>
                  ✅ Already completed
                </p>
              )}

              {/* Nav buttons */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center' }}>
                <button className="btn-ghost" disabled={idx === 0} onClick={prevLesson}
                  style={{ opacity: idx === 0 ? 0.4 : 1 }}>
                  ← Prev
                </button>
                <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                  {idx + 1} / {total}
                </span>
                <button className="btn-primary" onClick={completeLesson}>
                  {idx === total - 1
                    ? isDone ? '✅ Done' : `✅ Finish (+${mod.xpReward} pts)`
                    : isDone ? 'Next →' : 'Mark Complete & Next →'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Quiz Modal ───────────────────────────────────────────────── */}
      {quiz && (
        <div className="modal-overlay" id="quiz-modal">
          <div className="modal-card">
            <div className="modal-header">
              <h3>🧠 Quiz — {quiz.title}</h3>
              <button className="modal-close" onClick={closeQuiz}>✕</button>
            </div>

            {qs.map((q, qi) => (
              <div key={qi} className="quiz-question">
                <p className="quiz-q">{qi + 1}. {q.q}</p>
                <div className="quiz-options">
                  {q.options.map((opt, ai) => {
                    let cls = 'quiz-opt';
                    if (answers[qi] === ai)                               cls += ' selected';
                    if (submitted && ai === q.answer)                     cls += ' correct';
                    if (submitted && answers[qi] === ai && ai !== q.answer) cls += ' wrong';
                    return (
                      <button key={ai} id={`q${qi}-opt${ai}`} className={cls} onClick={() => handleAnswer(qi, ai)}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {!submitted ? (
              <button id="submit-quiz" className="btn-primary" onClick={handleSubmit}
                disabled={Object.keys(answers).length < qs.length}>
                Submit Answers
              </button>
            ) : (
              <div className="quiz-result">
                {(() => {
                  const score  = qs.reduce((s, q, i) => s + (answers[i] === q.answer ? 1 : 0), 0);
                  const reward = score === qs.length ? 50 : score >= qs.length / 2 ? 20 : 0;
                  return (
                    <p>
                      {score === qs.length ? '🎉 Perfect!' : score > 0 ? '✅' : '❌'}
                      {' '}{score}/{qs.length} correct!
                      {reward > 0 && <strong> +{reward} pts earned!</strong>}
                      {score === 0 && ' Review the lessons and try again.'}
                    </p>
                  );
                })()}
                <button className="btn-secondary" onClick={closeQuiz}>Close</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
