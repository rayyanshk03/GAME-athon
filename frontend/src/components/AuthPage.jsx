import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function AuthPage() {
  const { login } = useContext(AuthContext);
  const [isLogin, setIsLogin] = useState(true);
  const [userId, setUserId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint = isLogin ? '/api/users/login' : '/api/users/signup';
    const payload = isLogin 
      ? { userId, password } 
      : { userId, username: username || userId, password };

    try {
      const response = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Success! Update global AuthContext state
      login(data);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh',
      background: 'linear-gradient(135deg, #0e111a 0%, #171b26 100%)', color: '#fff', fontFamily: 'Inter, sans-serif'
    }}>
      <div className="auth-card" style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
        padding: '40px', borderRadius: '16px', width: '100%', maxWidth: '400px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)'
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '10px', fontSize: '28px', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
          StockQuest Platform
        </h1>
        <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#94a3b8', fontSize: '16px', fontWeight: '400' }}>
          {isLogin ? 'Sign in to your account' : 'Create a new account'}
        </h2>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#f87171', padding: '10px 14px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
          {error}
        </div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#cbd5e1' }}>User ID</label>
            <input 
              required
              type="text" 
              value={userId} 
              onChange={e => setUserId(e.target.value)}
              placeholder="e.g. johndoe123"
              style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '15px', outline: 'none' }}
              // Quick inline active styling can be added via classes, but this is barebones exact logic
            />
          </div>

          {!isLogin && (
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#cbd5e1' }}>Display Name</label>
              <input 
                type="text" 
                value={username} 
                onChange={e => setUsername(e.target.value)}
                placeholder="John Doe"
                style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '15px', outline: 'none' }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#cbd5e1' }}>Password</label>
            <input 
              required
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '15px', outline: 'none' }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ marginTop: '10px', width: '100%', padding: '14px', borderRadius: '8px', background: loading ? 'rgba(59,130,246,0.5)' : '#3b82f6', color: '#fff', fontSize: '16px', fontWeight: '600', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#94a3b8' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button" 
            onClick={() => { setIsLogin(!isLogin); setError(null); }}
            style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', fontWeight: '500', fontSize: '14px', padding: 0 }}
          >
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </p>

      </div>
    </div>
  );
}
