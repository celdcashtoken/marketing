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

function getStrength(pwd) {
  if (pwd.length === 0) return 0;
  if (pwd.length < 6) return 1;
  if (pwd.length < 9) return 2;
  if (pwd.length < 13) return 3;
  return 4;
}

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const SEGMENT_COLORS = [
  '',
  'bg-red-500',
  'bg-amber-400',
  'bg-[#00C896]',
  'bg-emerald-500',
];

function StrengthBar({ password }) {
  const strength = getStrength(password);
  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= strength ? SEGMENT_COLORS[strength] : 'bg-stone-200'
            }`}
          />
        ))}
      </div>
      {password.length > 0 && (
        <p className="text-xs mt-1 text-stone-500">
          Password strength: <span className="font-medium">{STRENGTH_LABELS[strength]}</span>
        </p>
      )}
    </div>
  );
}

export default function ChangePassword() {
  const { changePassword } = useAuth();
  const navigate = useNavigate();

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (newPwd !== confirmPwd) {
      setError("Passwords don't match.");
      return;
    }
    if (newPwd === currentPwd) {
      setError('New password must differ from current password.');
      return;
    }

    setLoading(true);
    try {
      const result = await changePassword(currentPwd, newPwd);
      if (result.ok) {
        navigate('/');
      } else {
        if (result.error === 'wrong_current_password') {
          setError('Current password is incorrect.');
        } else if (result.error === 'password_too_short') {
          setError('Password is too short. Please choose a longer password.');
        } else if (result.error === 'same_password') {
          setError('New password must differ from current password.');
        } else {
          setError('Something went wrong. Please try again.');
        }
      }
    } catch {
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

          <h1 className="text-xl font-semibold text-zinc-900 mb-1">Choose a new password</h1>
          <p className="text-sm text-stone-500 mb-5">Set a secure password to continue.</p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6 text-sm text-amber-800">
            <span className="font-semibold">Required.</span> The default password follows the same
            formula for everyone — please change it to something unique before continuing.
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-5 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-zinc-900 uppercase tracking-wide mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#00C896] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-900 uppercase tracking-wide mb-1.5">
                New Password
              </label>
              <input
                type="password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                autoComplete="new-password"
                required
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#00C896] focus:border-transparent"
              />
              <StrengthBar password={newPwd} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-900 uppercase tracking-wide mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                autoComplete="new-password"
                required
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#00C896] focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-700 text-white text-sm font-medium rounded-lg py-2.5 hover:bg-amber-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving…' : 'Change password & continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
