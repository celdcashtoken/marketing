import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { callApi } from '../lib/api';
import { useAuth } from '../lib/auth';
import { canSeeTask } from '../lib/permissions';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import RejectModal from '../components/RejectModal';

function formatDeadline(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  const now = new Date();
  const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: 'Overdue', overdue: true };
  if (diffDays === 0) return { label: 'Today', overdue: true };
  if (diffDays === 1) return { label: 'Tomorrow', warn: true };
  return { label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) };
}

function ApprovalCard({ task, users, onComplete, onReject, completing, rejecting }) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const assignee = users.find(u => u.id === task.assignee_id);
  const dl = formatDeadline(task.deadline);

  return (
    <>
      <div className={`bg-white border rounded-md p-4 flex gap-4 items-start ${dl?.overdue ? 'border-l-[3px] border-l-red-500 border-stone-200' : 'border-stone-200'}`}>
        {/* Icon */}
        <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center text-base flex-shrink-0">
          📋
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-zinc-900 text-[13px] mb-1">{task.title}</div>
          <div className="flex flex-wrap items-center gap-2 text-[10.5px] text-stone-400">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
            {assignee && (
              <span className="flex items-center gap-1">
                <span className="w-4 h-4 rounded-full bg-stone-200 inline-flex items-center justify-center text-[8px] font-semibold text-stone-600">
                  {assignee.avatar || assignee.name?.[0]?.toUpperCase()}
                </span>
                {assignee.name}
                {task.category && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded text-[9px] font-medium ${
                    task.category === 'creatives'
                      ? 'bg-violet-50 text-violet-600'
                      : 'bg-pink-50 text-pink-600'
                  }`}>
                    {task.category}
                  </span>
                )}
              </span>
            )}
            {dl && (
              <span className={dl.overdue ? 'text-red-500 font-medium' : dl.warn ? 'text-amber-600' : ''}>
                {dl.label}
              </span>
            )}
          </div>
          {task.rejection_feedback && (
            <div className="mt-2 text-[10.5px] text-stone-500 bg-stone-50 border border-stone-100 rounded px-2 py-1.5">
              <span className="font-semibold text-stone-600">Previous feedback: </span>
              {task.rejection_feedback}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => setShowRejectModal(true)}
            disabled={completing || rejecting}
            className="px-3 py-1.5 text-[11px] font-medium text-red-600 border border-red-200 rounded-md bg-white hover:bg-red-50 disabled:opacity-40"
          >
            Reject
          </button>
          <button
            onClick={() => onComplete(task.id)}
            disabled={completing || rejecting}
            className="px-3 py-1.5 text-[11px] font-medium text-white bg-amber-700 rounded-md hover:bg-amber-800 disabled:opacity-40"
          >
            {completing ? 'Completing…' : 'Mark Completed ✓'}
          </button>
        </div>
      </div>

      {showRejectModal && (
        <RejectModal
          task={task}
          onConfirm={(feedback) => {
            onReject(task.id, feedback);
            setShowRejectModal(false);
          }}
          onCancel={() => setShowRejectModal(false)}
          submitting={rejecting}
        />
      )}
    </>
  );
}

export default function ApprovalQueue() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [actionState, setActionState] = useState({}); // taskId → 'completing' | 'rejecting'

  // Only CMO and assistant can access this page
  const isCmoOrAssistant = user?.role === 'cmo' || user?.secondary_role === 'assistant';
  if (!isCmoOrAssistant) {
    navigate('/');
    return null;
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: ['all'],
    queryFn: () => callApi('getAll'),
    refetchInterval: 15000,
    staleTime: 10000,
  });

  const allTasks = data?.data?.tasks || [];
  const users = data?.data?.users || [];

  const queue = allTasks.filter(t => t.status === 'ready_for_cmo_review');

  // Split by category for CMO's filtered view
  const [categoryFilter, setCategoryFilter] = useState('all');
  const filtered = categoryFilter === 'all'
    ? queue
    : queue.filter(t => t.category === categoryFilter);

  function updateTaskInCache(taskId, updates) {
    qc.setQueryData(['all'], old => {
      if (!old?.data?.tasks) return old;
      return {
        ...old,
        data: {
          ...old.data,
          tasks: old.data.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t),
        },
      };
    });
  }

  async function handleComplete(taskId) {
    setActionState(s => ({ ...s, [taskId]: 'completing' }));
    const res = await callApi('completeTask', { task_id: taskId });
    setActionState(s => ({ ...s, [taskId]: null }));
    if (res.ok) {
      updateTaskInCache(taskId, { status: 'completed' });
    }
  }

  async function handleReject(taskId, feedback) {
    setActionState(s => ({ ...s, [taskId]: 'rejecting' }));
    const res = await callApi('update', {
      sheet: 'Tasks',
      id: taskId,
      updates: { status: 'in_progress', rejection_feedback: feedback },
    });
    setActionState(s => ({ ...s, [taskId]: null }));
    if (res.ok) {
      updateTaskInCache(taskId, { status: 'in_progress', rejection_feedback: feedback });
    }
  }

  const creativesCount = queue.filter(t => t.category === 'creatives').length;
  const socialsCount = queue.filter(t => t.category === 'socials').length;

  return (
    <div className="p-6">
      <div className="flex items-end justify-between mb-5">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-zinc-900">Approval Queue</h1>
          <p className="text-[12px] text-stone-400 mt-0.5">
            {queue.length === 0
              ? 'Nothing awaiting your approval'
              : `${queue.length} task${queue.length !== 1 ? 's' : ''} ready for your review`}
          </p>
        </div>
      </div>

      {/* Category filter tabs */}
      <div className="flex gap-0 border-b border-stone-200 mb-5">
        {[
          { value: 'all', label: 'All', count: queue.length },
          { value: 'creatives', label: 'Creatives', count: creativesCount },
          { value: 'socials', label: 'Socials', count: socialsCount },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setCategoryFilter(f.value)}
            className={`px-3.5 py-2 text-[12.5px] border-b-2 -mb-px transition-colors ${
              categoryFilter === f.value
                ? 'border-[#00C896] text-zinc-900 font-medium'
                : 'border-transparent text-stone-400 hover:text-zinc-700'
            }`}
          >
            {f.label}
            <span className="ml-1.5 font-mono text-[9px] text-stone-300">{f.count}</span>
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-stone-200 border-t-[#00C896] rounded-full animate-spin" />
        </div>
      )}

      {isError && (
        <div className="text-center py-16 text-stone-400 text-sm">
          Failed to load. Check your connection.
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="text-center py-20">
          <div className="text-5xl mb-3">✓</div>
          <div className="text-zinc-900 font-semibold text-base mb-1">All clear</div>
          <div className="text-stone-400 text-sm">No tasks waiting on your approval.</div>
        </div>
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <>
          {/* CMO rejection note */}
          <div className="mb-4 px-3 py-2 bg-amber-50 border border-amber-100 rounded-md text-[11px] text-amber-700">
            💡 <strong>Rejection cascades through the Head.</strong> When you reject a task, it returns to In Progress — the Head sees your feedback and routes it back to the member, preserving the chain of accountability.
          </div>

          <div className="space-y-3">
            {filtered.map(task => (
              <ApprovalCard
                key={task.id}
                task={task}
                users={users}
                onComplete={handleComplete}
                onReject={handleReject}
                completing={actionState[task.id] === 'completing'}
                rejecting={actionState[task.id] === 'rejecting'}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
