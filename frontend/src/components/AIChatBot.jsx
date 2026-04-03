import { useState, useRef, useEffect } from 'react';
import { askChatbot } from '../api/apiClient';

const QUICK = [
  'What is RSI?',
  'How do moving averages work?',
  'What is market sentiment?',
  'How do I manage risk?',
  'Explain options delta',
  'What is a Golden Cross?',
];

export default function AIChatBot() {
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState([{
    role: 'ai',
    text: '👋 Hi! I\'m your StockQuest AI tutor powered by FinGPT. Ask me anything about trading, stocks, or market concepts!',
    source: 'system',
  }]);
  const [input,   setInput]   = useState('');
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
      const ans = await askChatbot(question);
      // ans is a string from apiClient, but the backend now also sends source
      // We handle both cases gracefully
      const text   = typeof ans === 'object' ? ans.text   : ans;
      const source = typeof ans === 'object' ? ans.source : null;
      setMessages(m => [...m, { role: 'ai', text, source }]);
    } catch (e) {
      setMessages(m => [...m, { role: 'ai', text: `⚠️ ${e.message}`, source: 'error' }]);
    }
    setLoading(false);
  }

  return (
    <>
      <button
        id="chatbot-fab"
        className={`chatbot-fab ${open ? 'open' : ''}`}
        onClick={() => setOpen(o => !o)}
        title="Open AI Tutor"
      >
        {open ? '✕' : '🤖'}
      </button>

      {open && (
        <div className="chatbot-window" id="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontWeight: 700 }}>🤖 FinGPT Tutor</span>
              <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', marginTop: -2 }}>
                Powered by FinGPT RAG · Financial AI
              </span>
            </div>
            <button onClick={() => setOpen(false)}>✕</button>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role}`}>
                <span>{m.text}</span>
                {m.source && m.source !== 'system' && m.source !== 'error' && (
                  <span style={{
                    display: 'block',
                    fontSize: '0.6rem',
                    marginTop: 4,
                    opacity: 0.55,
                    textAlign: m.role === 'ai' ? 'left' : 'right',
                  }}>
                    {m.source === 'fingpt' ? '⚡ FinGPT RAG' : '🤖 AI'}
                  </span>
                )}
              </div>
            ))}
            {loading && (
              <div className="chat-msg ai typing" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🧠 FinGPT thinking</span>
                <span style={{ display: 'flex', gap: 3 }}>
                  {[0, 1, 2].map(d => (
                    <span key={d} style={{
                      width: 5, height: 5, borderRadius: '50%', background: '#60A5FA',
                      animation: `bounce 0.8s ${d * 0.2}s infinite`,
                      display: 'inline-block',
                    }} />
                  ))}
                </span>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick replies */}
          <div className="quick-replies">
            {QUICK.map(q => (
              <button key={q} className="quick-btn" onClick={() => send(q)}>{q}</button>
            ))}
          </div>

          {/* Input */}
          <div className="chatbot-input-row">
            <input
              id="chatbot-input"
              className="chatbot-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask about stocks, RSI, options…"
            />
            <button id="chatbot-send" className="btn-primary" onClick={() => send()}>Send</button>
          </div>

          <style>{`
            @keyframes bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-4px); }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
