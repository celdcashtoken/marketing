import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { callApi } from '../lib/api';
import { useAuth } from '../lib/auth';
import { canSeeTask } from '../lib/permissions';
import TaskRow from '../components/TaskRow';
import StatusBadge from '../components/StatusBadge';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'ready_for_head_review', label: 'Head Review' },
  { value: 'ready_for_cmo_review', label: 'CMO Review' },
  { value: 'completed', label: 'Completed' },
];

function TaskTable({ tasks, user, users, onUpdate, showAssignee }) {
  if (tasks.length === 0) return null;
  return (
    <div className="bg-white border border-stone-200 rounded-md overflow-hidden">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-stone-100">
            <th className="py-2 px-3 text-left font-mono text-[9px] uppercase tracking-widest text-stone-400">Task</th>
            <th className="py-2 px-3 text-left font-mono text-[9px] uppercase tracking-widest text-stone-400">Status</th>
            <th className="py-2 px-3 text-left font-mono text-[9px] uppercase tracking-widest text-stone-400">Priority</th>
            <th className="py-2 px-3 text-left font-mono text-[9px] uppercase tracking-widest text-stone-400">Progress</th>
            <th className="py-2 px-3 text-left font-mono text-[9px] uppercase tracking-widest text-stone-400">Deadline</th>
            {showAssignee && (
              <th className="py-2 px-3 text-left font-mono text-[9px] uppercase tracking-widest text-stone-400">Assignee</th>
            )}
          </tr>
        </thead>
        <tbody>
          {tasks.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              user={user}
              users={users}
              onUpdate={onUpdate}
              showAssignee={showAssignee}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Tasks() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['all'],
    queryFn: () => callApi('getAll'),
    refetchInterval: 15000,
    staleTime: 10000,
  });

  const allTasks = (data?.data?.tasks || []).filter(t => canSeeTask(user, t));
  const users = data?.data?.users || [];

  const isMember = user?.role === 'member';
  const isHead = user?.role === 'head';

  // Head review queue — team tasks waiting on the Head's approval
  const headReviewQueue = isHead
    ? allTasks.filter(t => t.status === 'ready_for_head_review' && t.assignee_id !== user.id)
    : [];

  // For tab filtering, exclude the review queue tasks so they don't double-appear
  const mainTasks = isHead && statusFilter === 'all'
    ? allTasks.filter(t => t.status !== 'ready_for_head_review' || t.assignee_id === user.id)
    : allTasks;

  const filtered = statusFilter === 'all'
    ? mainTasks
    : allTasks.filter(t => t.status === statusFilter);

  function handleTaskUpdate(updated) {
    qc.setQueryData(['all'], old => {
      if (!old?.data?.tasks) return old;
      return {
        ...old,
        data: {
          ...old.data,
          tasks: old.data.tasks.map(t => t.id === updated.id ? updated : t),
        },
      };
    });
  }

  const categoryLabel = user?.category
    ? user.category.charAt(0).toUpperCase() + user.category.slice(1)
    : '';

  return (
    <div className="p-6">
      {/* Page header */}
      <div className="flex items-end justify-between mb-5">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-zinc-900">
            {isMember ? 'My Tasks' : isHead ? `${categoryLabel} Tasks` : 'Tasks'}
          </h1>
          <p className="text-[12px] text-stone-400 mt-0.5">
            {isMember
              ? `${allTasks.length} task${allTasks.length !== 1 ? 's' : ''} assigned to you`
              : `${allTasks.length} task${allTasks.length !== 1 ? 's' : ''} in your scope`}
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-stone-200 border-t-[#00C896] rounded-full animate-spin" />
        </div>
      )}

      {isError && (
        <div className="text-center py-16 text-stone-400 text-sm">
          Failed to load tasks. Check your connection.
        </div>
      )}

      {!isLoading && !isError && (
        <>
          {/* Head review queue — shown at the top when there are items */}
          {isHead && headReviewQueue.length > 0 && (
            <div className="mb-7">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-[13px] font-semibold text-zinc-900">⚡ Awaiting your review</h2>
                <span className="bg-amber-100 text-amber-700 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-full">
                  {headReviewQueue.length}
                </span>
              </div>
              <TaskTable
                tasks={headReviewQueue}
                user={user}
                users={users}
                onUpdate={handleTaskUpdate}
                showAssignee={true}
              />
            </div>
          )}

          {/* Head own-work note */}
          {isHead && (
            <div className="mb-4 px-3 py-2 bg-stone-50 border border-stone-200 rounded-md text-[11px] text-stone-400">
              🚦 <strong className="text-stone-500">Your own tasks</strong> skip the Head review gate — they go directly to CMO Review.
            </div>
          )}

          {/* Status filter tabs */}
          <div className="flex gap-0 border-b border-stone-200 mb-5">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3.5 py-2 text-[12.5px] border-b-2 -mb-px transition-colors ${
                  statusFilter === f.value
                    ? 'border-[#00C896] text-zinc-900 font-medium'
                    : 'border-transparent text-stone-400 hover:text-zinc-700'
                }`}
              >
                {f.label}
                {f.value !== 'all' && (
                  <span className="ml-1.5 font-mono text-[9px] text-stone-300">
                    {allTasks.filter(t => t.status === f.value).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-stone-300 text-4xl mb-3">☑</div>
              <div className="text-stone-400 text-sm">
                {statusFilter === 'all' ? 'No tasks yet.' : `No ${statusFilter.replace(/_/g, ' ')} tasks.`}
              </div>
            </div>
          ) : (
            <TaskTable
              tasks={filtered}
              user={user}
              users={users}
              onUpdate={handleTaskUpdate}
              showAssignee={!isMember}
            />
          )}

          {isMember && (
            <p className="text-[10.5px] text-stone-300 mt-4 italic text-center">
              Only Chinny can mark a task Completed.
            </p>
          )}
        </>
      )}
    </div>
  );
}
