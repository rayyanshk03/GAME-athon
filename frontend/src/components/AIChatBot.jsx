import { useState, useRef, useEffect } from 'react';
import { answerTradingQuestion } from '../services/AIFeedbackService';

const QUICK = ['What is RSI?', 'How do moving averages work?', 'What is market sentiment?', 'How do I manage risk?'];

export default function AIChatBot() {
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState([{ role: 'ai', text: '👋 Hi! I\'m your StockQuest AI tutor. Ask me anything about trading!' }]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function send(q) {
    const question = q || input.trim();
    if (!question || loading) return;
    setInput('');
    setMessages(m => [...m, { role: 'user', text: question }]);
    setLoading(true);
    try {
      const ans = await answerTradingQuestion(question);
      setMessages(m => [...m, { role: 'ai', text: ans }]);
    } catch {
      setMessages(m => [...m, { role: 'ai', text: '⚠️ Couldn\'t reach AI. Add VITE_GEMINI_API_KEY to your .env file.' }]);
    }
    setLoading(false);
  }

  return (
    <>
      <button id="chatbot-fab" className={`chatbot-fab ${open ? 'open' : ''}`} onClick={() => setOpen(o => !o)}>
        {open ? '✕' : '🤖'}
      </button>
      {open && (
        <div className="chatbot-window" id="chatbot-window">
          <div className="chatbot-header">
            <span>🤖 AI Tutor</span>
            <button onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className="chatbot-messages">
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role}`}>{m.text}</div>
            ))}
            {loading && <div className="chat-msg ai typing">🧠 Thinking…</div>}
            <div ref={endRef} />
          </div>
          <div className="quick-replies">
            {QUICK.map(q => <button key={q} className="quick-btn" onClick={() => send(q)}>{q}</button>)}
          </div>
          <div className="chatbot-input-row">
            <input id="chatbot-input" className="chatbot-input" value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask anything about trading…" />
            <button id="chatbot-send" className="btn-primary" onClick={() => send()}>Send</button>
          </div>
        </div>
      )}
    </>
  );
}
