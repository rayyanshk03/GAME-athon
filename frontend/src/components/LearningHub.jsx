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

export default function LearningHub() {
  const { earnPoints } = useGamification();

  // { moduleId: lessonIndex (0-based, how many completed) }
  const [progress,  setProgress]  = useState(loadProgress);
  // Lesson viewer state
  const [lesson,    setLesson]    = useState(null); // { module, lessonIdx }
  // Quiz state
  const [quiz,      setQuiz]      = useState(null);
  const [answers,   setAnswers]   = useState({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => saveProgress(progress), [progress]);

  // ── Lesson viewer ─────────────────────────────────────────────────────
  function openLesson(mod) {
    const done = progress[mod.id] || 0;
    const idx  = Math.min(done, mod.lessons.length - 1); // open next uncompleted
    setLesson({ mod, idx });
  }

  function completeLesson() {
    const { mod, idx } = lesson;
    const done = progress[mod.id] || 0;
    if (idx >= done) {
      const newDone = idx + 1;
      setProgress(p => ({ ...p, [mod.id]: newDone }));
      // Award XP when module fully completed
      if (newDone === mod.lessons.length) earnPoints(mod.xpReward);
    }
    // Advance to next lesson or close if done
    if (idx < mod.lessons.length - 1) {
      setLesson({ mod, idx: idx + 1 });
    } else {
      setLesson(null);
    }
  }

  function prevLesson() {
    if (lesson.idx > 0) setLesson(l => ({ ...l, idx: l.idx - 1 }));
  }

  // ── Quiz ──────────────────────────────────────────────────────────────
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
    const reward = score === qs.length ? 30 : score > 0 ? 10 : 0;
    if (reward) earnPoints(reward);
  }

  const qs = quiz ? (QUIZ_QUESTIONS[quiz.id] || []) : [];

  // ── Module card grid ──────────────────────────────────────────────────
  return (
    <div className="learning-page" id="learning-hub">
      <h2 className="section-title">📚 Learning Hub</h2>

      <div className="modules-grid">
        {LEARNING_MODULES.map(mod => {
          const total = mod.lessons.length;
          const done  = Math.min(progress[mod.id] || 0, total);
          const pct   = Math.round((done / total) * 100);
          const full  = done === total;

          return (
            <div key={mod.id} className="module-card" id={`module-${mod.id}`}>
              <div className="module-icon">{mod.icon}</div>
              <div className="module-info">
                <div className="module-title">{mod.title}</div>
                <div className="module-meta">
                  <span className={`difficulty difficulty-${mod.difficulty.toLowerCase()}`}>{mod.difficulty}</span>
                  <span className="module-reward">+{mod.xpReward} pts</span>
                </div>
                <div className="module-progress-bar">
                  <div className="module-fill" style={{ width: `${pct}%`, background: full ? '#10B981' : undefined }} />
                </div>
                <div className="module-count">{done}/{total} lessons · {pct}%</div>
              </div>
              <div className="module-actions">
                <button
                  className="btn-secondary"
                  onClick={() => openLesson(mod)}
                >
                  {full ? '✅ Review' : done === 0 ? '▶ Start' : '▶ Continue'}
                </button>
                {QUIZ_QUESTIONS[mod.id] && (
                  <button
                    id={`quiz-${mod.id}`}
                    className="btn-primary"
                    onClick={() => startQuiz(mod)}
                  >🧠 Quiz</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Lesson Viewer Modal ─────────────────────────────────────── */}
      {lesson && (() => {
        const { mod, idx } = lesson;
        const total  = mod.lessons.length;
        const ls     = mod.lessons[idx];
        const done   = progress[mod.id] || 0;
        const isDone = idx < done; // already completed

        return (
          <div className="modal-overlay" id="lesson-modal" onClick={e => { if (e.target === e.currentTarget) setLesson(null); }}>
            <div className="modal-card" style={{ maxWidth: 600, width: '92%' }}>
              {/* Header */}
              <div className="modal-header">
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--muted)', display: 'block', marginBottom: 2 }}>
                    {mod.icon} {mod.title} — Lesson {idx + 1} of {total}
                  </span>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{ls.title}</h3>
                </div>
                <button className="modal-close" onClick={() => setLesson(null)}>✕</button>
              </div>

              {/* Progress bar */}
              <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, margin: '0.75rem 0' }}>
                <div style={{
                  height: '100%', borderRadius: 2, background: '#3B82F6',
                  width: `${((idx + 1) / total) * 100}%`, transition: 'width 0.3s',
                }} />
              </div>

              {/* Content */}
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '1.25rem',
                lineHeight: 1.75,
                fontSize: '0.9rem',
                color: 'var(--text)',
                minHeight: 120,
                marginBottom: '1.25rem',
              }}>
                {ls.content}
              </div>

              {/* Completion badge */}
              {isDone && (
                <p style={{ fontSize: '0.78rem', color: '#10B981', marginBottom: '0.75rem' }}>
                  ✅ Already completed
                </p>
              )}

              {/* Nav buttons */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  className="btn-ghost"
                  disabled={idx === 0}
                  onClick={prevLesson}
                  style={{ opacity: idx === 0 ? 0.4 : 1 }}
                >← Prev</button>

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

      {/* ── Quiz Modal ────────────────────────────────────────────────── */}
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
                    if (answers[qi] === ai)                           cls += ' selected';
                    if (submitted && ai === q.answer)                 cls += ' correct';
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
              <button
                id="submit-quiz"
                className="btn-primary"
                onClick={handleSubmit}
                disabled={Object.keys(answers).length < qs.length}
              >
                Submit Answers
              </button>
            ) : (
              <div className="quiz-result">
                {(() => {
                  const score = qs.reduce((s, q, i) => s + (answers[i] === q.answer ? 1 : 0), 0);
                  const reward = score === qs.length ? 30 : score > 0 ? 10 : 0;
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
