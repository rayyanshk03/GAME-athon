import { useState } from 'react';
import { LEARNING_MODULES, QUIZ_QUESTIONS } from '../api/staticData';
import { useGamification } from '../context/GamificationContext';

export default function LearningHub() {
  const { earnPoints } = useGamification();
  const [progress, setProgress] = useState({});     // { moduleId: lessonsCompleted }
  const [quiz, setQuiz]         = useState(null);   // active quiz module id
  const [answers, setAnswers]   = useState({});
  const [submitted, setSubmitted] = useState(false);

  function startQuiz(id) { setQuiz(id); setAnswers({}); setSubmitted(false); }
  function closeQuiz()   { setQuiz(null); setSubmitted(false); }

  function handleAnswer(qi, ai) {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qi]: ai }));
  }

  function handleSubmit() {
    setSubmitted(true);
    const qs     = QUIZ_QUESTIONS[quiz] || [];
    const score  = qs.reduce((s, q, i) => s + (answers[i] === q.answer ? 1 : 0), 0);
    const reward = score === qs.length ? 30 : score > 0 ? 10 : 0;
    if (reward) earnPoints(reward);
  }

  const qs = QUIZ_QUESTIONS[quiz] || [];

  return (
    <div className="learning-page" id="learning-hub">
      <h2 className="section-title">📚 Learning Hub</h2>
      <div className="modules-grid">
        {LEARNING_MODULES.map(m => {
          const done = progress[m.id] || 0;
          const pct  = Math.round((done / m.lessons) * 100);
          return (
            <div key={m.id} className="module-card" id={`module-${m.id}`}>
              <div className="module-icon">{m.icon}</div>
              <div className="module-info">
                <div className="module-title">{m.title}</div>
                <div className="module-meta">
                  <span className={`difficulty difficulty-${m.difficulty.toLowerCase()}`}>{m.difficulty}</span>
                  <span className="module-reward">+{m.xpReward} pts</span>
                </div>
                <div className="module-progress-bar">
                  <div className="module-fill" style={{ width: `${pct}%` }} />
                </div>
                <div className="module-count">{done}/{m.lessons} lessons · {pct}%</div>
              </div>
              <div className="module-actions">
                <button className="btn-secondary" onClick={() => setProgress(p => ({ ...p, [m.id]: Math.min(done + 1, m.lessons) }))}>
                  {done === m.lessons ? '✅ Review' : '▶ Continue'}
                </button>
                {QUIZ_QUESTIONS[m.id] && (
                  <button id={`quiz-${m.id}`} className="btn-primary" onClick={() => startQuiz(m.id)}>🧠 Quiz</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quiz modal */}
      {quiz && (
        <div className="modal-overlay" id="quiz-modal">
          <div className="modal-card">
            <div className="modal-header">
              <h3>🧠 Quiz — {LEARNING_MODULES.find(m => m.id === quiz)?.title}</h3>
              <button className="modal-close" onClick={closeQuiz}>✕</button>
            </div>
            {qs.map((q, qi) => (
              <div key={qi} className="quiz-question">
                <p className="quiz-q">{qi + 1}. {q.q}</p>
                <div className="quiz-options">
                  {q.options.map((opt, ai) => {
                    let cls = 'quiz-opt';
                    if (answers[qi] === ai) cls += ' selected';
                    if (submitted && ai === q.answer) cls += ' correct';
                    if (submitted && answers[qi] === ai && ai !== q.answer) cls += ' wrong';
                    return (
                      <button key={ai} id={`q${qi}-opt${ai}`} className={cls} onClick={() => handleAnswer(qi, ai)}>{opt}</button>
                    );
                  })}
                </div>
              </div>
            ))}
            {!submitted ? (
              <button id="submit-quiz" className="btn-primary" onClick={handleSubmit}
                disabled={Object.keys(answers).length < qs.length}>Submit Answers</button>
            ) : (
              <div className="quiz-result">
                {(() => {
                  const score = qs.reduce((s, q, i) => s + (answers[i] === q.answer ? 1 : 0), 0);
                  return <p>{score === qs.length ? '🎉 Perfect!' : '✅'} {score}/{qs.length} correct! {score === qs.length ? '+30 pts bonus!' : score > 0 ? '+10 pts' : 'Try again!'}</p>;
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
