import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { callApi } from '../lib/api';
import { useAuth } from '../lib/auth';

function formatWeek(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function buildMasterSummary(users, tasks, reports) {
  const members = users.filter(u => u.role === 'member' || u.role === 'head');
  const totalTasks = tasks.length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const pending = tasks.filter(t => t.status === 'pending').length;
  const urgent = tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length;

  const creativesTasks = tasks.filter(t => t.category === 'creatives');
  const socialsTasks = tasks.filter(t => t.category === 'socials');

  const thisWeekStart = (() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  })();

  const weekReports = reports.filter(r => r.week_start === thisWeekStart);
  const submittedNames = weekReports.map(r => {
    const u = users.find(x => x.id === r.user_id);
    return u?.name ?? 'Unknown';
  });
  const notSubmitted = members.filter(m => !weekReports.find(r => r.user_id === m.id));

  const blockers = reports
    .filter(r => r.challenges?.trim())
    .slice(0, 3)
    .map(r => {
      const u = users.find(x => x.id === r.user_id);
      return `• ${u?.name ?? 'Team member'}: ${r.challenges.trim()}`;
    });

  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return `CASHTOKEN MARKETING — TEAM SUMMARY
Generated ${date}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OVERALL TASK STATUS
Total tasks tracked: ${totalTasks}
  ✓ Completed:   ${completed} (${totalTasks ? Math.round((completed / totalTasks) * 100) : 0}%)
  ⟳ In progress: ${inProgress}
  ○ Pending:     ${pending}
  ⚠ Urgent open: ${urgent}

BY CATEGORY
  Creatives — ${creativesTasks.filter(t => t.status === 'completed').length}/${creativesTasks.length} tasks completed
  Socials   — ${socialsTasks.filter(t => t.status === 'completed').length}/${socialsTasks.length} tasks completed

WEEKLY REPORT SUBMISSIONS (week of ${formatWeek(thisWeekStart)})
Submitted (${weekReports.length}): ${submittedNames.length ? submittedNames.join(', ') : 'None yet'}
Pending   (${notSubmitted.length}): ${notSubmitted.length ? notSubmitted.map(m => m.name).join(', ') : 'All submitted ✓'}

${blockers.length ? `ACTIVE BLOCKERS / CHALLENGES\n${blockers.join('\n')}` : 'No blockers reported this week.'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RECOMMENDATIONS
${urgent > 0 ? `• ${urgent} urgent task${urgent > 1 ? 's' : ''} still open — review priorities with relevant Heads.` : '• No urgent open tasks. Team workload is on track.'}
${notSubmitted.length > 0 ? `• ${notSubmitted.map(m => m.name).join(', ')} ${notSubmitted.length === 1 ? 'has' : 'have'} not submitted a weekly report — follow up.` : '• All team members have submitted weekly reports this week.'}
${completed / (totalTasks || 1) >= 0.7 ? '• Completion rate is strong (≥70%). Consider raising the bar on scope for next cycle.' : '• Completion rate is below 70%. Identify bottlenecks in the approval chain.'}`;
}

function buildIndividualSummary(member, tasks, reports) {
  const memberTasks = tasks.filter(t => t.assigned_to_id === member.id);
  const completed = memberTasks.filter(t => t.status === 'completed').length;
  const inProgress = memberTasks.filter(t => t.status === 'in_progress').length;
  const pending = memberTasks.filter(t => t.status === 'pending').length;
  const blocked = memberTasks.filter(t => t.rejection_feedback?.trim()).length;

  const memberReports = [...reports]
    .filter(r => r.user_id === member.id)
    .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));

  const latestReport = memberReports[0];
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const roleLabel = member.role === 'head'
    ? `Head of ${member.category?.charAt(0).toUpperCase()}${member.category?.slice(1) ?? ''}`
    : `${member.category?.charAt(0).toUpperCase()}${member.category?.slice(1) ?? ''} Team Member`;

  return `CASHTOKEN MARKETING — INDIVIDUAL REPORT
${member.name?.toUpperCase()} · ${roleLabel}
Generated ${date}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TASK PERFORMANCE
Total assigned: ${memberTasks.length}
  ✓ Completed:   ${completed}
  ⟳ In progress: ${inProgress}
  ○ Pending:     ${pending}
  ✗ Rejected/blocked: ${blocked}

${memberTasks.length > 0 ? `RECENT TASKS\n${memberTasks.slice(0, 5).map(t => `  ${t.status === 'completed' ? '✓' : t.status === 'in_progress' ? '⟳' : '○'} [${t.priority ?? 'medium'}] ${t.title}`).join('\n')}` : 'No tasks assigned yet.'}

LATEST WEEKLY REPORT${latestReport ? ` (week of ${formatWeek(latestReport.week_start)})` : ''}
${latestReport ? `Tasks completed:\n  ${latestReport.tasks_completed ?? '—'}

${latestReport.challenges ? `Challenges:\n  ${latestReport.challenges}` : ''}
${latestReport.pending_tasks ? `\nPending:\n  ${latestReport.pending_tasks}` : ''}
${latestReport.support_needed ? `\nSupport needed:\n  ${latestReport.support_needed}` : ''}` : 'No weekly report submitted yet.'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ASSESSMENT
${completed / (memberTasks.length || 1) >= 0.6 ? `• ${member.name?.split(' ')[0]} is delivering consistently — ${completed}/${memberTasks.length} tasks completed.` : `• Completion rate is low (${memberTasks.length ? Math.round((completed / memberTasks.length) * 100) : 0}%) — check if workload is realistic or if blockers need to be cleared.`}
${blocked > 0 ? `• ${blocked} task${blocked > 1 ? 's have' : ' has'} been rejected — review feedback and ensure re-submission.` : '• No rejected tasks outstanding.'}
${memberReports.length === 0 ? '• No weekly reports on file. Encourage regular submissions.' : `• ${memberReports.length} weekly report${memberReports.length > 1 ? 's' : ''} on record.`}`;
}

function GeneratedDraft({ text, onCopy }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="mt-5 bg-white border border-stone-200 rounded-md overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-stone-50 border-b border-stone-200">
        <span className="font-mono text-[9px] uppercase tracking-widest text-stone-400">Generated draft</span>
        <button
          onClick={handleCopy}
          className="text-[11px] text-stone-400 hover:text-zinc-900 font-mono"
        >
          {copied ? '✓ copied' : 'copy'}
        </button>
      </div>
      <pre className="px-4 py-4 text-[11.5px] text-zinc-700 leading-relaxed whitespace-pre-wrap font-mono overflow-x-auto">
        {text}
      </pre>
    </div>
  );
}

export default function AiReports() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('master'); // 'master' | 'individual'
  const [selectedUserId, setSelectedUserId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [draft, setDraft] = useState(null);
  const draftRef = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ['all'],
    queryFn: () => callApi('getAll'),
    refetchInterval: 15000,
    staleTime: 10000,
  });

  const canAccess = user?.role === 'cmo' || user?.secondary_role === 'assistant';
  if (!canAccess) {
    navigate('/', { replace: true });
    return null;
  }

  const allUsers = data?.data?.users ?? [];
  const allTasks = data?.data?.tasks ?? [];
  const allReports = data?.data?.reports ?? [];
  const teamMembers = allUsers.filter(u => u.role === 'member' || u.role === 'head');

  async function handleGenerate() {
    setDraft(null);
    setGenerating(true);

    // Simulate AI processing delay
    await new Promise(r => setTimeout(r, 1800 + Math.random() * 800));

    let text;
    if (mode === 'master') {
      text = buildMasterSummary(allUsers, allTasks, allReports);
    } else {
      const member = allUsers.find(u => u.id === selectedUserId);
      if (!member) { setGenerating(false); return; }
      text = buildIndividualSummary(member, allTasks, allReports);
    }

    setGenerating(false);
    setDraft(text);
    setTimeout(() => draftRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  }

  const canGenerate = mode === 'master' || selectedUserId !== '';

  return (
    <div className="p-6 max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-[22px] font-semibold tracking-tight text-zinc-900">AI Reports</h1>
          <span className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 bg-violet-50 text-violet-600 rounded-full border border-violet-100">
            Beta
          </span>
        </div>
        <p className="text-[12px] text-stone-400">
          Generate structured summaries from live task and report data. Available to CMO and assistant only.
        </p>
      </div>

      {/* Mode selector */}
      <div className="bg-white border border-stone-200 rounded-md p-4 mb-4">
        <div className="font-mono text-[9px] uppercase tracking-widest text-stone-400 mb-3">Report type</div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { setMode('master'); setDraft(null); }}
            className={`px-3 py-1.5 text-[12px] rounded-md border transition-colors ${
              mode === 'master'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
            }`}
          >
            Master team summary
          </button>
          <button
            onClick={() => { setMode('individual'); setDraft(null); }}
            className={`px-3 py-1.5 text-[12px] rounded-md border transition-colors ${
              mode === 'individual'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
            }`}
          >
            Individual member report
          </button>
        </div>

        {mode === 'master' && (
          <p className="mt-3 text-[11.5px] text-stone-400 leading-relaxed">
            Rolls up all tasks, weekly reports, completion rates, blockers, and submission status across the entire team into a single structured summary.
          </p>
        )}

        {mode === 'individual' && (
          <div className="mt-3">
            <label className="block font-mono text-[9px] uppercase tracking-widest text-stone-400 mb-1.5">
              Select team member
            </label>
            {isLoading ? (
              <div className="h-9 bg-stone-100 rounded-md animate-pulse w-48" />
            ) : (
              <select
                value={selectedUserId}
                onChange={e => { setSelectedUserId(e.target.value); setDraft(null); }}
                className="border border-stone-200 rounded-md px-3 py-2 text-[12.5px] text-zinc-800 focus:outline-none focus:border-[#00C896] bg-white min-w-[220px]"
              >
                <option value="">— choose a member —</option>
                {teamMembers.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name}{m.role === 'head' ? ` (Head, ${m.category})` : ` (${m.category})`}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={!canGenerate || generating || isLoading}
        className="flex items-center gap-2 px-4 py-2 text-[12.5px] font-medium text-white bg-[#00C896] rounded-md hover:bg-[#00b386] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {generating ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating…
          </>
        ) : (
          <>
            <span className="text-base leading-none">✦</span>
            Generate report
          </>
        )}
      </button>

      {generating && (
        <div className="mt-5 bg-stone-50 border border-stone-200 rounded-md px-4 py-6 text-center">
          <div className="w-6 h-6 border-2 border-stone-200 border-t-[#00C896] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[12px] text-stone-400">
            Analysing {mode === 'master' ? 'team data' : 'member data'}…
          </p>
        </div>
      )}

      {draft && (
        <div ref={draftRef}>
          <GeneratedDraft text={draft} />
          <p className="mt-3 text-[10.5px] text-stone-400 leading-relaxed">
            This draft was generated from live data at {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}. Review before sharing — AI summaries may omit context.
          </p>
        </div>
      )}
    </div>
  );
}
