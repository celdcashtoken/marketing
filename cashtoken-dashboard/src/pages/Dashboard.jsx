import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Zap,
  CheckSquare,
  FileText,
  Inbox,
  Users,
  Lock,
  Search,
  Bell,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { callApi } from '../lib/api';

function BrandMark() {
  return (
    <div className="flex items-center gap-2 px-4 py-4 border-b border-stone-200">
      <div className="w-7 h-7 bg-[#00C896] rounded-md flex items-center justify-center flex-shrink-0">
        <div className="w-3.5 h-3.5 bg-white rounded-sm" />
      </div>
      <div>
        <div className="font-semibold text-zinc-900 text-sm leading-tight">CashToken</div>
        <div className="font-mono text-[8px] uppercase tracking-widest text-stone-400">
          Marketing Ops
        </div>
      </div>
    </div>
  );
}

function navLinkClass({ isActive }) {
  return [
    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors',
    isActive
      ? 'bg-stone-100 text-zinc-900 font-medium'
      : 'text-stone-500 hover:bg-stone-50 hover:text-zinc-900',
  ].join(' ');
}

function Badge({ count, color = 'amber' }) {
  if (!count) return null;
  const cls = color === 'rose'
    ? 'bg-rose-100 text-rose-600'
    : 'bg-amber-100 text-amber-700';
  return (
    <span className={`${cls} text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-full`}>
      {count}
    </span>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const role = user?.role;
  const isMember = role === 'member';
  const isCmoOrAssistant = role === 'cmo' || user?.secondary_role === 'assistant';
  const isHead = role === 'head';

  // Live data for badge counts
  const { data } = useQuery({
    queryKey: ['all'],
    queryFn: () => callApi('getAll'),
    refetchInterval: 15000,
    staleTime: 10000,
  });

  const tasks = data?.data?.tasks || [];
  const requests = data?.data?.requests || [];

  // Approval queue count — tasks at ready_for_cmo_review (CMO/assistant sees all)
  const approvalCount = isCmoOrAssistant
    ? tasks.filter(t => t.status === 'ready_for_cmo_review').length
    : isHead
    ? tasks.filter(t => t.status === 'ready_for_head_review' && t.category === user?.category && t.assignee_id !== user?.id).length
    : 0;

  // Requests needing triage (submitted, not yet approved)
  const pendingRequestsCount = requests.filter(r => r.status === 'submitted').length;

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  // Avatar color per role
  const avatarColor = role === 'cmo'
    ? 'bg-amber-700'
    : role === 'head' && user?.category === 'socials'
    ? 'bg-pink-600'
    : user?.secondary_role === 'assistant'
    ? 'bg-emerald-600'
    : role === 'head'
    ? 'bg-violet-600'
    : 'bg-slate-400';

  return (
    <div className="flex h-screen bg-stone-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-48 flex-shrink-0 bg-white border-r border-stone-200 flex flex-col">
        <BrandMark />

        <nav className="flex-1 px-2 py-3 space-y-0.5">
          <NavLink to="/" end className={navLinkClass}>
            <LayoutDashboard size={15} />
            Dashboard
          </NavLink>

          {/* Approval Queue — CMO/assistant see it; Heads see their review queue */}
          {(isCmoOrAssistant || isHead) ? (
            <NavLink to="/approvals" className={navLinkClass}>
              <Zap size={15} />
              <span className="flex-1">{isCmoOrAssistant ? 'Approval Queue' : 'Review Queue'}</span>
              <Badge count={approvalCount} color={isCmoOrAssistant ? 'amber' : 'amber'} />
            </NavLink>
          ) : (
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] opacity-40 cursor-not-allowed select-none">
              <Zap size={15} />
              <span className="flex-1">Approval Queue</span>
              <Lock size={11} />
            </div>
          )}

          <NavLink to="/tasks" className={navLinkClass}>
            <CheckSquare size={15} />
            {isMember ? 'My Tasks' : 'Tasks'}
          </NavLink>

          <NavLink to="/reports" className={navLinkClass}>
            <FileText size={15} />
            {isMember ? 'My Reports' : 'Reports'}
          </NavLink>

          {!isMember ? (
            <NavLink to="/requests" className={navLinkClass}>
              <Inbox size={15} />
              <span className="flex-1">Requests</span>
              {pendingRequestsCount > 0 && <Badge count={pendingRequestsCount} color="rose" />}
            </NavLink>
          ) : (
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] opacity-40 cursor-not-allowed select-none">
              <Inbox size={15} />
              <span className="flex-1">Requests</span>
              <Lock size={11} />
            </div>
          )}

          {!isMember ? (
            <NavLink to="/team" className={navLinkClass}>
              <Users size={15} />
              {isHead ? 'My Team' : 'Team'}
            </NavLink>
          ) : (
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] opacity-40 cursor-not-allowed select-none">
              <Users size={15} />
              <span className="flex-1">Team</span>
              <Lock size={11} />
            </div>
          )}

          {isCmoOrAssistant && (
            <NavLink to="/ai-reports" className={navLinkClass}>
              <Sparkles size={15} />
              <span className="flex-1">AI Reports</span>
              <span className="text-[8px] font-mono uppercase tracking-wide text-violet-500 bg-violet-50 px-1 py-0.5 rounded">AI</span>
            </NavLink>
          )}
        </nav>

        {/* User footer */}
        <div className="border-t border-stone-200 px-3 py-3">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-7 h-7 ${avatarColor} rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}>
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-zinc-900 truncate">{user?.name ?? 'User'}</div>
              <div className="font-mono text-[9px] uppercase tracking-wider text-stone-400 truncate">
                {role === 'head'
                  ? `Head · ${user?.category || ''}`
                  : user?.secondary_role === 'assistant'
                  ? 'Member · Asst'
                  : role}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-zinc-900 transition-colors"
          >
            <LogOut size={12} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-12 bg-white border-b border-stone-200 flex items-center px-4 gap-3 flex-shrink-0">
          <div className="flex items-center gap-2 bg-stone-100 rounded-lg px-3 py-1.5 flex-1 max-w-sm">
            <Search size={13} className="text-stone-400 flex-shrink-0" />
            <span className="text-sm text-stone-400">Search…</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <SyncPill data={data} />
            <button className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 hover:text-zinc-900 transition-colors">
              <Bell size={16} />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SyncPill({ data }) {
  const ts = data?.timestamp;
  const [stale, setStale] = useState(false);

  // Flip to stale after 30s from last fetch
  React.useEffect(() => {
    if (!ts) return;
    setStale(false);
    const timer = setTimeout(() => setStale(true), 30000);
    return () => clearTimeout(timer);
  }, [ts]);

  const label = ts ? (stale ? 'stale' : 'synced just now') : 'connecting…';
  const dotColor = ts && !stale ? 'bg-[#00C896]' : 'bg-amber-400';

  return (
    <div className={`flex items-center gap-1.5 text-xs font-mono ${stale ? 'text-amber-600' : 'text-stone-500'}`}>
      <div className={`w-2 h-2 rounded-full ${dotColor}`} />
      {label}
    </div>
  );
}

// Need React for useEffect in SyncPill
import React, { useState } from 'react';
