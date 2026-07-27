import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { callApi } from '../lib/api';
import { useAuth } from '../lib/auth';

// ─── Invite Member Modal ─────────────────────────────────────────────────────

function InviteModal({ onClose, onSuccess, user }) {
  const isCMO = user?.role === 'cmo';
  const lockedCategory = isCMO ? '' : user?.category;

  const [form, setForm] = useState({
    name: '',
    username: '',
    category: lockedCategory,
    role: 'member',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null); // success state shows default password

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }));
  }

  // Preview the default password as they type the username
  const defaultPassword = form.username.length >= 3
    ? form.username.slice(0, 3).toUpperCase() + '6700'
    : form.username.length > 0
    ? form.username.toUpperCase().padEnd(3, '?').slice(0, 3) + '6700'
    : null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.username.trim() || !form.category) {
      setError('All fields are required.');
      return;
    }
    if (!/^[a-z][a-z0-9]{1,29}$/.test(form.username)) {
      setError('Username must be lowercase letters/numbers, 2–30 chars, starting with a letter.');
      return;
    }
    setSubmitting(true);
    setError(null);

    const res = await callApi('inviteMember', {
      invited_name: form.name.trim(),
      invited_username: form.username.trim().toLowerCase(),
      assigned_role: 'member',
      assigned_category: form.category,
    });

    setSubmitting(false);
    if (res.ok) {
      setResult(res);
    } else {
      setError(res.error || 'Failed to invite member.');
    }
  }

  const categoryColor = form.category === 'socials'
    ? 'bg-pink-600'
    : 'bg-violet-600';

  if (result) {
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4"
           style={{ background: 'rgba(15,23,42,0.4)' }}>
        <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-xl">
          <div className="px-5 py-6 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="font-semibold text-zinc-900 text-base mb-2">Account created!</h3>
            <p className="text-[12.5px] text-stone-500 mb-4">
              <strong>{result.user_id ? form.name : 'The new member'}</strong> can now sign in.
              Share these credentials privately:
            </p>
            <div className="bg-stone-50 border border-stone-200 rounded-lg px-4 py-3 text-left mb-4">
              <div className="flex justify-between mb-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-stone-400">Username</span>
                <span className="font-mono text-[13px] text-zinc-900">{form.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-stone-400">Default password</span>
                <span className="font-mono text-[13px] font-semibold text-zinc-900">{result.default_password}</span>
              </div>
            </div>
            <p className="text-[10.5px] text-stone-400 mb-4">
              They'll be forced to change this password on first login.
            </p>
            <button
              onClick={() => { onSuccess?.(); onClose(); }}
              className="w-full py-2 text-[12px] font-medium text-white bg-slate-900 rounded-md hover:bg-black"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4"
         style={{ background: 'rgba(15,23,42,0.4)' }}>
      <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
          <div>
            <div className="font-semibold text-zinc-900 text-sm">
              Invite a new {lockedCategory ? lockedCategory.charAt(0).toUpperCase() + lockedCategory.slice(1) : ''} member
            </div>
            <div className="text-[11px] text-stone-400 mt-0.5">
              They'll sign in with a username and default password.
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-zinc-900 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5">
          {error && (
            <div className="mb-3 px-3 py-2 bg-red-50 border border-red-100 rounded-md text-[11.5px] text-red-600">
              {error}
            </div>
          )}

          <div className="mb-3">
            <label className="block font-mono text-[9.5px] uppercase tracking-widest text-stone-400 mb-1.5">
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={set('name')}
              placeholder="e.g. Aisha Bello"
              className="w-full border border-stone-200 rounded-md px-3 py-2 text-[12.5px] text-zinc-800 placeholder:text-stone-300 focus:outline-none focus:border-[#00C896]"
            />
          </div>

          <div className="mb-3">
            <label className="block font-mono text-[9.5px] uppercase tracking-widest text-stone-400 mb-1.5">
              Username (lowercase) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') }))}
              placeholder="e.g. aisha"
              className="w-full border border-stone-200 rounded-md px-3 py-2 text-[12.5px] text-zinc-800 placeholder:text-stone-300 focus:outline-none focus:border-[#00C896]"
            />
            <p className="text-[10.5px] text-stone-400 mt-1">Lowercase letters/numbers only. Usually their first name.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block font-mono text-[9.5px] uppercase tracking-widest text-stone-400 mb-1.5">Category</label>
              {lockedCategory ? (
                <input
                  type="text"
                  value={lockedCategory.charAt(0).toUpperCase() + lockedCategory.slice(1)}
                  readOnly
                  className="w-full border border-stone-100 rounded-md px-3 py-2 text-[12.5px] bg-stone-50 text-stone-400 cursor-not-allowed"
                />
              ) : (
                <select
                  value={form.category}
                  onChange={set('category')}
                  className="w-full border border-stone-200 rounded-md px-3 py-2 text-[12.5px] bg-white focus:outline-none focus:border-[#00C896]"
                >
                  <option value="">— Choose —</option>
                  <option value="creatives">Creatives</option>
                  <option value="socials">Socials</option>
                </select>
              )}
              {lockedCategory && <p className="text-[10px] text-stone-400 mt-1">Locked to your category.</p>}
            </div>
            <div>
              <label className="block font-mono text-[9.5px] uppercase tracking-widest text-stone-400 mb-1.5">Role</label>
              <input
                type="text"
                value="Member"
                readOnly
                className="w-full border border-stone-100 rounded-md px-3 py-2 text-[12.5px] bg-stone-50 text-stone-400 cursor-not-allowed"
              />
              <p className="text-[10px] text-stone-400 mt-1">Heads can only invite Members.</p>
            </div>
          </div>

          {/* Default password preview */}
          {defaultPassword && (
            <div className="mb-4 flex items-start gap-2 px-3 py-2.5 bg-[#ECFDF5] border border-[#00C896]/20 rounded-md text-[11.5px] text-zinc-700">
              <span className="text-base flex-shrink-0">🔑</span>
              <div>
                Default password will be{' '}
                <strong className="font-mono">{defaultPassword}</strong>
                {form.name && ` (first 3 letters of "${form.username}" + 6700)`}.
                Share this with {form.name || 'them'} privately — they'll be forced to change it on first login.
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-3 py-1.5 text-[12px] font-medium text-stone-600 border border-stone-200 rounded-md bg-white hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-4 py-1.5 text-[12px] font-medium text-white rounded-md disabled:opacity-50 ${
                form.category === 'socials' ? 'bg-pink-600 hover:bg-pink-700' : 'bg-slate-900 hover:bg-black'
              }`}
            >
              {submitting ? 'Creating…' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Member Row ──────────────────────────────────────────────────────────────

function MemberRow({ member, tasks }) {
  const memberTasks = tasks.filter(t => t.assignee_id === member.id);
  const active    = memberTasks.filter(t => !['completed'].includes(t.status)).length;
  const inReview  = memberTasks.filter(t => ['ready_for_head_review', 'ready_for_cmo_review'].includes(t.status)).length;
  const completed = memberTasks.filter(t => t.status === 'completed').length;

  const isAssistant = member.secondary_role === 'assistant';

  return (
    <tr className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 ${
            isAssistant ? 'bg-emerald-600' : 'bg-stone-400'
          }`}>
            {member.avatar || member.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <div className="font-medium text-zinc-900 text-[13px] flex items-center gap-1.5">
              {member.name}
              {isAssistant && (
                <span className="text-[8.5px] font-mono uppercase tracking-wide bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">+Asst</span>
              )}
            </div>
            <div className="font-mono text-[9px] text-stone-400 uppercase tracking-wide">{member.username}</div>
          </div>
        </div>
      </td>
      <td className="py-3 px-4 text-center">
        <span className="text-[13px] font-semibold text-zinc-900">{active}</span>
      </td>
      <td className="py-3 px-4 text-center">
        <span className={`text-[13px] font-semibold ${inReview > 0 ? 'text-amber-700' : 'text-stone-300'}`}>{inReview}</span>
      </td>
      <td className="py-3 px-4 text-center">
        <span className={`text-[13px] font-semibold ${completed > 0 ? 'text-emerald-600' : 'text-stone-300'}`}>{completed}</span>
      </td>
      <td className="py-3 px-4">
        {/* Simple workload bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-[3px] bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#00C896] rounded-full"
              style={{ width: `${Math.min(100, active * 15)}%` }}
            />
          </div>
          <span className="font-mono text-[10px] text-stone-400 w-8 text-right">{active} task{active !== 1 ? 's' : ''}</span>
        </div>
      </td>
    </tr>
  );
}

// ─── Category Section ────────────────────────────────────────────────────────

function CategorySection({ category, users, tasks, currentUser, onInvite }) {
  const head = users.find(u => u.role === 'head' && u.category === category);
  const members = users.filter(u => u.role === 'member' && u.category === category);
  const allInCategory = head ? [head, ...members] : members;

  const activeTasks = tasks.filter(t => t.category === category && t.status !== 'completed').length;
  const completedTasks = tasks.filter(t => t.category === category && t.status === 'completed').length;
  const totalTasks = tasks.filter(t => t.category === category).length;
  const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const isCreatives = category === 'creatives';
  const accent = isCreatives ? 'text-violet-600 bg-violet-50 border-violet-200' : 'text-pink-600 bg-pink-50 border-pink-200';
  const barColor = isCreatives ? 'bg-violet-500' : 'bg-pink-500';

  const canInviteHere = currentUser?.role === 'cmo'
    || (currentUser?.role === 'head' && currentUser?.category === category);

  return (
    <div className="mb-8">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className={`text-[11px] font-mono font-semibold uppercase tracking-wide px-2 py-1 rounded border ${accent}`}>
            {category}
          </span>
          {head && (
            <span className="text-[12px] text-stone-500">
              Head: <span className="font-medium text-zinc-900">{head.name}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-24 h-[3px] bg-stone-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${barColor}`} style={{ width: `${completionPct}%` }} />
            </div>
            <span className="font-mono text-[10px] text-stone-400">{completionPct}%</span>
          </div>
          {canInviteHere && (
            <button
              onClick={() => onInvite(category)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11.5px] font-medium border border-stone-200 rounded-md bg-white hover:bg-stone-50 text-zinc-700"
            >
              + Invite member
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white border border-stone-200 rounded-md px-3 py-2.5 text-center">
          <div className="font-mono text-[9px] uppercase tracking-widest text-stone-400 mb-1">Team size</div>
          <div className="text-xl font-bold text-zinc-900">{allInCategory.length}</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-md px-3 py-2.5 text-center">
          <div className="font-mono text-[9px] uppercase tracking-widest text-stone-400 mb-1">Active tasks</div>
          <div className="text-xl font-bold text-zinc-900">{activeTasks}</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-md px-3 py-2.5 text-center">
          <div className="font-mono text-[9px] uppercase tracking-widest text-stone-400 mb-1">Completed</div>
          <div className="text-xl font-bold text-emerald-600">{completedTasks}</div>
        </div>
      </div>

      {/* Members table */}
      {allInCategory.length === 0 ? (
        <div className="bg-white border border-dashed border-stone-200 rounded-md px-4 py-10 text-center">
          <div className="text-3xl mb-2">👥</div>
          <div className="text-stone-400 text-sm mb-3">No members yet in {category}.</div>
          {canInviteHere && (
            <button
              onClick={() => onInvite(category)}
              className="px-3 py-1.5 text-[12px] font-medium text-white bg-slate-900 rounded-md hover:bg-black"
            >
              + Invite first member
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-md overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="py-2 px-4 text-left font-mono text-[9px] uppercase tracking-widest text-stone-400">Member</th>
                <th className="py-2 px-4 text-center font-mono text-[9px] uppercase tracking-widest text-stone-400">Active</th>
                <th className="py-2 px-4 text-center font-mono text-[9px] uppercase tracking-widest text-stone-400">In Review</th>
                <th className="py-2 px-4 text-center font-mono text-[9px] uppercase tracking-widest text-stone-400">Done</th>
                <th className="py-2 px-4 text-left font-mono text-[9px] uppercase tracking-widest text-stone-400">Workload</th>
              </tr>
            </thead>
            <tbody>
              {allInCategory.map(member => (
                <MemberRow key={member.id} member={member} tasks={tasks} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Joan's solo state */}
      {category === 'socials' && members.length === 0 && head && (
        <div className="mt-3 px-4 py-5 rounded-md text-center"
             style={{ background: 'linear-gradient(135deg, #FCE7F3 0%, #FAFAF9 100%)', border: '1px solid #F9A8D4' }}>
          <div className="text-3xl mb-2">👥</div>
          <div className="font-semibold text-zinc-900 text-[14px] mb-1">
            {head.name}'s team is just {head.name === 'Joan' ? 'her' : 'them'} right now
          </div>
          <div className="text-[12.5px] text-stone-500 max-w-sm mx-auto mb-3">
            Socials is growing. Invite new members to delegate work and build the team's capacity.
          </div>
          {canInviteHere && (
            <button
              onClick={() => onInvite(category)}
              className="px-4 py-1.5 text-[12px] font-medium text-white bg-pink-600 rounded-md hover:bg-pink-700"
            >
              + Invite first Socials member
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function Team() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [inviteCategory, setInviteCategory] = useState(null); // null = closed

  const isCMO = user?.role === 'cmo';
  const isAssistant = user?.secondary_role === 'assistant';
  const isHead = user?.role === 'head';

  // Only CMO, assistant, and heads can see this page
  if (!isCMO && !isAssistant && !isHead) {
    return (
      <div className="flex items-center justify-center h-full py-24 text-stone-400 text-sm">
        You don't have access to the Team page.
      </div>
    );
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: ['all'],
    queryFn: () => callApi('getAll'),
    refetchInterval: 15000,
    staleTime: 10000,
  });

  const users = (data?.data?.users || []).filter(u => u.status !== 'disabled');
  const tasks = data?.data?.tasks || [];

  // CMO/assistant see both categories; Head sees only their own
  const categories = (isCMO || isAssistant)
    ? ['creatives', 'socials']
    : [user?.category];

  function handleInviteSuccess() {
    qc.invalidateQueries({ queryKey: ['all'] });
  }

  return (
    <div className="p-6">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-zinc-900">
            {isCMO || isAssistant ? 'Team' : 'My Team'}
          </h1>
          <p className="text-[12px] text-stone-400 mt-0.5">
            {users.filter(u => u.role !== 'cmo').length} members across{' '}
            {categories.length} {categories.length === 1 ? 'category' : 'categories'}
          </p>
        </div>
        {(isCMO || isHead) && (
          <button
            onClick={() => setInviteCategory(user?.category || 'creatives')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-white bg-slate-900 rounded-md hover:bg-black"
          >
            + Invite member
          </button>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-stone-200 border-t-[#00C896] rounded-full animate-spin" />
        </div>
      )}

      {isError && (
        <div className="text-center py-16 text-stone-400 text-sm">Failed to load team data.</div>
      )}

      {!isLoading && !isError && categories.map(cat => (
        <CategorySection
          key={cat}
          category={cat}
          users={users}
          tasks={tasks}
          currentUser={user}
          onInvite={setInviteCategory}
        />
      ))}

      {inviteCategory && (
        <InviteModal
          user={user}
          onClose={() => setInviteCategory(null)}
          onSuccess={handleInviteSuccess}
        />
      )}
    </div>
  );
}
