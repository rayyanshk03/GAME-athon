import { useState } from 'react';
import { login, register } from '../api/apiClient';

export default function LoginPage({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let response;
      if (isLogin) {
        response = await login(email, password);
      } else {
        response = await register(username, email, password);
      }
      
      if (response && response.user) {
        onLoginSuccess(response.user);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-glow-1"></div>
      <div className="login-glow-2"></div>
      
      <div className="login-card panel">
        <div className="login-header">
          <div className="brand-logo">🚀</div>
          <h1 className="brand-name">STOCKQUEST</h1>
          <p className="login-subtitle">
            {isLogin ? 'Welcome back, Trader' : 'Join the Elite League'}
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label>Username</label>
              <input 
                type="text" 
                placeholder="Choose a callsign..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required={!isLogin}
              />
            </div>
          )}
          
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <button type="submit" className="btn-primary login-submit" disabled={loading}>
            {loading ? (
              <span className="loading-dots">Initializing session...</span>
            ) : (
              isLogin ? 'Enter Terminal' : 'Initialize Account'
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>
            {isLogin ? "New to the floor?" : "Already have an account?"}
            <button 
              className="btn-ghost" 
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
            >
              {isLogin ? 'Register Now' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
