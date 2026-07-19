import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function StaffLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectTo = location.state?.from?.pathname || '/app';

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }
    setLoading(true);
    try {
      await login(username, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid username or password.');
    }
    setLoading(false);
  };

  return (
    <div className="bg-stadium-lights text-on-surface min-h-screen flex items-center justify-center p-container-margin font-sans relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-secondary-fixed/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-[80px]" />
      </div>

      <div className="w-full max-w-md z-10 relative">
        <div className="text-center mb-lg">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-container-high border border-white/10 shadow-lg mb-4">
            <span className="material-symbols-outlined text-secondary-fixed text-4xl">sports_soccer</span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface mb-2 tracking-tight">Staff Portal</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">StadiumIQ Operations</p>
        </div>

        <div className="glass-card rounded-xl p-md shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

          {error && (
            <div className="bg-error-container/20 border border-error/30 rounded-lg p-3 mb-md flex items-start gap-3 relative z-10">
              <span className="material-symbols-outlined text-error mt-0.5">error</span>
              <div>
                <p className="font-label-sm text-label-sm text-on-error-container font-semibold">Authentication Failed</p>
                <p className="font-body-md text-body-md text-on-error-container/80 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          <form className="space-y-md relative z-10" onSubmit={handleSignIn}>
            <div className="space-y-2">
              <label className="font-label-sm text-label-sm text-on-surface-variant block uppercase tracking-wider" htmlFor="username">
                Username
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                  person
                </span>
                <input
                  className="w-full bg-[#000000] border border-outline-variant rounded-lg py-3 pl-10 pr-4 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50 neon-focus transition-all duration-200"
                  id="username"
                  name="username"
                  placeholder="admin"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-label-sm text-label-sm text-on-surface-variant block uppercase tracking-wider" htmlFor="password">
                  Password
                </label>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                  lock
                </span>
                <input
                  className="w-full bg-[#000000] border border-outline-variant rounded-lg py-3 pl-10 pr-10 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50 neon-focus transition-all duration-200"
                  id="password"
                  name="password"
                  placeholder="Pass@123"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                  onClick={() => setShowPassword((v) => !v)}
                  type="button"
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button
              className="w-full bg-secondary-fixed text-on-secondary-fixed font-headline-md text-headline-md py-3 rounded-lg flex items-center justify-center gap-2 glow-effect-hover transition-all duration-300 mt-lg disabled:opacity-60 disabled:cursor-not-allowed"
              type="submit"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
              {!loading && <span className="material-symbols-outlined">arrow_forward</span>}
            </button>
          </form>
        </div>

        <div className="text-center mt-lg">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant hover:text-secondary-fixed transition-colors"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Fan Mode
          </Link>
        </div>
      </div>
    </div>
  );
}

export default StaffLogin;