import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

function BrandMark() {
  return (
    <div className="flex flex-col items-center gap-2 mb-8">
      <div className="w-10 h-10 bg-[#00C896] rounded-lg flex items-center justify-center">
        <div className="w-5 h-5 bg-white rounded-sm" />
      </div>
      <div className="text-center">
        <div className="font-semibold text-zinc-900 text-base leading-tight">CashToken</div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-stone-400 mt-0.5">
          Marketing Operations
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(username, password);

      if (result.ok) {
        if (result.must_change_password) {
          navigate('/change-password');
        } else {
          navigate('/');
        }
      } else {
        setPassword('');
        if (result.error === 'disabled') {
          setError('Your access has been disabled. Contact your admin.');
        } else {
          setError('Username or password is incorrect.');
        }
      }
    } catch {
      setPassword('');
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-stone-200 rounded-xl p-10">
          <BrandMark />

          <h1 className="text-xl font-semibold text-zinc-900 mb-1">Sign in</h1>
          <p className="text-sm text-stone-500 mb-6">
            Enter your credentials to access the dashboard.
          </p>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-5 text-sm text-red-700">
              <span className="mt-0.5">ℹ</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-zinc-900 uppercase tracking-wide mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g., chinny"
                autoComplete="username"
                required
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#00C896] focus:border-transparent"
              />
              <p className="text-xs text-stone-400 mt-1">Your lowercase first name</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-900 uppercase tracking-wide mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#00C896] focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white text-sm font-medium rounded-lg py-2.5 hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-xs text-stone-400 mt-6 text-center">
            Default password is your name + last 4 digits of your phone number.
          </p>
        </div>
      </div>
    </div>
  );
}
