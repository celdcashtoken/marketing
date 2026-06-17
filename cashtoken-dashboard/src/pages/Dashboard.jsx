import { NavLink, Outlet, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { useAuth } from '../lib/auth';

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
    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
    isActive
      ? 'bg-stone-100 text-zinc-900 font-medium'
      : 'text-stone-500 hover:bg-stone-50 hover:text-zinc-900',
  ].join(' ');
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const role = user?.role;
  const isMember = role === 'member';
  const isCmoOrAssistant =
    role === 'cmo' || user?.secondary_role === 'assistant';

  // Fake counts for UI demo
  const approvalCount = 3;
  const requestCount = 2;

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

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

          {isCmoOrAssistant ? (
            <NavLink to="/approvals" className={navLinkClass}>
              <Zap size={15} />
              <span className="flex-1">Approval Queue</span>
              <span className="bg-amber-100 text-amber-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                {approvalCount}
              </span>
            </NavLink>
          ) : (
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm opacity-40 cursor-not-allowed select-none">
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
            Reports
          </NavLink>

          {!isMember && (
            <NavLink to="/requests" className={navLinkClass}>
              <Inbox size={15} />
              <span className="flex-1">Requests</span>
              <span className="bg-rose-100 text-rose-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                {requestCount}
              </span>
            </NavLink>
          )}

          {!isMember ? (
            <NavLink to="/team" className={navLinkClass}>
              <Users size={15} />
              Team
            </NavLink>
          ) : (
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm opacity-40 cursor-not-allowed select-none">
              <Users size={15} />
              <span className="flex-1">Team</span>
              <Lock size={11} />
            </div>
          )}
        </nav>

        {/* User footer */}
        <div className="border-t border-stone-200 px-3 py-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-[#00C896] rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-zinc-900 truncate">{user?.name ?? 'User'}</div>
              <div className="text-[10px] text-stone-400 capitalize truncate">{role ?? ''}</div>
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
            <div className="flex items-center gap-1.5 text-xs text-stone-500">
              <div className="w-2 h-2 rounded-full bg-[#00C896]" />
              synced just now
            </div>
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
