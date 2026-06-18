import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { callApi } from '../lib/api';
import { useAuth } from '../lib/auth';
import ReportForm from '../components/ReportForm';
import { SkeletonCard } from '../components/Skeleton';

function canSeeReport(user, report) {
  if (user.role === 'cmo' || user.secondary_role === 'assistant') return true;
  if (user.role === 'head') return report.category === user.category;
  return report.user_id === user.id;
}

function formatWeek(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function ReportCard({ report, users }) {
  const [expanded, setExpanded] = useState(false);
  const author = users.find(u => u.id === report.user_id);

  const categoryColor = report.category === 'creatives'
    ? 'bg-violet-50 text-violet-600'
    : report.category === 'socials'
    ? 'bg-pink-50 text-pink-600'
    : 'bg-stone-100 text-stone-500';

  return (
    <div className="bg-white border border-stone-200 rounded-md overflow-hidden">
      {/* Card header — always visible */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-stone-50 transition-colors"
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-[11px] font-semibold text-stone-600 flex-shrink-0">
          {author?.avatar || author?.name?.[0]?.toUpperCase() || '?'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-zinc-900 text-[13px]">
              {author?.name ?? 'Unknown'}
            </span>
            {report.category && (
              <span className={`text-[9px] font-mono uppercase tracking-wide px-1.5 py-0.5 rounded ${categoryColor}`}>
                {report.category}
              </span>
            )}
          </div>
          <div className="text-[10.5px] text-stone-400 mt-0.5">
            Week of {formatWeek(report.week_start)} · Submitted {formatDate(report.submitted_at)}
          </div>
        </div>

        <span className="text-stone-300 text-sm flex-shrink-0">{expanded ? '▴' : '▾'}</span>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-stone-100 px-4 py-4 space-y-4">
          {[
            { label: 'Tasks completed', value: report.tasks_completed },
            { label: 'Challenges & blockers', value: report.challenges },
            { label: 'Pending tasks', value: report.pending_tasks },
            { label: 'Support needed', value: report.support_needed },
            { label: 'Suggestions', value: report.suggestions },
          ].map(({ label, value }) => value ? (
            <div key={label}>
              <div className="font-mono text-[9px] uppercase tracking-widest text-stone-400 mb-1">{label}</div>
              <p className="text-[12.5px] text-zinc-700 leading-relaxed whitespace-pre-wrap">{value}</p>
            </div>
          ) : null)}
        </div>
      )}
    </div>
  );
}

export default function Reports() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['all'],
    queryFn: () => callApi('getAll'),
    refetchInterval: 15000,
    staleTime: 10000,
  });

  const allReports = (data?.data?.reports || []).filter(r => canSeeReport(user, r));
  const users = data?.data?.users || [];

  // Sort newest first
  const sorted = [...allReports].sort((a, b) =>
    new Date(b.submitted_at) - new Date(a.submitted_at)
  );

  // Check if current user has submitted this week
  const thisWeekStart = (() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  })();

  const submittedThisWeek = allReports.some(
    r => r.user_id === user.id && r.week_start === thisWeekStart
  );

  const isMember = user?.role === 'member';
  const isHead = user?.role === 'head';
  const isCmoOrAssistant = user?.role === 'cmo' || user?.secondary_role === 'assistant';

  function handleSuccess() {
    setShowForm(false);
    qc.invalidateQueries({ queryKey: ['all'] });
  }

  const pageTitle = isMember ? 'My Reports' : isHead
    ? `${user.category?.charAt(0).toUpperCase()}${user.category?.slice(1)} Reports`
    : 'Reports';

  const pageSubtitle = isMember
    ? `${allReports.length} report${allReports.length !== 1 ? 's' : ''} submitted`
    : `${allReports.length} report${allReports.length !== 1 ? 's' : ''} in your scope`;

  return (
    <div className="p-6">
      <div className="flex items-end justify-between mb-5">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-zinc-900">{pageTitle}</h1>
          <p className="text-[12px] text-stone-400 mt-0.5">{pageSubtitle}</p>
        </div>
        {/* Everyone can submit their own report */}
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-white bg-slate-900 rounded-md hover:bg-black"
        >
          + Submit report
        </button>
      </div>

      {/* "Not submitted this week" reminder for members/heads */}
      {!submittedThisWeek && !isCmoOrAssistant && (
        <div className="mb-5 flex items-center gap-3 px-4 py-3 bg-[#ECFDF5] border border-[#00C896]/20 rounded-md">
          <span className="text-lg">📝</span>
          <div className="flex-1">
            <div className="font-medium text-zinc-900 text-[13px]">
              Your weekly report is due
            </div>
            <div className="text-[11px] text-stone-500 mt-0.5">
              Week of {new Date(thisWeekStart).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-3 py-1.5 text-[11.5px] font-medium text-white bg-slate-900 rounded-md hover:bg-black flex-shrink-0"
          >
            Submit now
          </button>
        </div>
      )}

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} lines={2} />)}
        </div>
      )}

      {isError && (
        <div className="text-center py-16 text-stone-400 text-sm">
          Failed to load reports. Check your connection.
        </div>
      )}

      {!isLoading && !isError && sorted.length === 0 && (
        <div className="text-center py-16">
          <div className="text-stone-300 text-4xl mb-3">📋</div>
          <div className="text-stone-400 text-sm">No reports submitted yet.</div>
        </div>
      )}

      {!isLoading && !isError && sorted.length > 0 && (
        <div className="space-y-2">
          {sorted.map(report => (
            <ReportCard
              key={report.id}
              report={report}
              users={users}
            />
          ))}
        </div>
      )}

      {showForm && (
        <ReportForm
          onClose={() => setShowForm(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
