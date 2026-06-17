import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { callApi } from '../lib/api';
import { useAuth } from '../lib/auth';
import { canSeeTask } from '../lib/permissions';
import TaskRow from '../components/TaskRow';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'ready_for_head_review', label: 'Head Review' },
  { value: 'ready_for_cmo_review', label: 'CMO Review' },
  { value: 'completed', label: 'Completed' },
];

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

  const tasks = (data?.data?.tasks || []).filter(t => canSeeTask(user, t));
  const users = data?.data?.users || [];

  const filtered = statusFilter === 'all'
    ? tasks
    : tasks.filter(t => t.status === statusFilter);

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

  const isMember = user?.role === 'member';

  return (
    <div className="p-6">
      <div className="flex items-end justify-between mb-5">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-zinc-900">
            {isMember ? 'My Tasks' : 'Tasks'}
          </h1>
          <p className="text-[12px] text-stone-400 mt-0.5">
            {isMember
              ? `${tasks.length} task${tasks.length !== 1 ? 's' : ''} assigned to you`
              : `${tasks.length} task${tasks.length !== 1 ? 's' : ''} in your scope`}
          </p>
        </div>
      </div>

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
                {tasks.filter(t => t.status === f.value).length}
              </span>
            )}
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
          Failed to load tasks. Check your connection.
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="text-center py-16">
          <div className="text-stone-300 text-4xl mb-3">☑</div>
          <div className="text-stone-400 text-sm">
            {statusFilter === 'all' ? 'No tasks yet.' : `No ${statusFilter.replace(/_/g, ' ')} tasks.`}
          </div>
        </div>
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-md overflow-hidden">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="py-2 px-3 text-left font-mono text-[9px] uppercase tracking-widest text-stone-400">Task</th>
                <th className="py-2 px-3 text-left font-mono text-[9px] uppercase tracking-widest text-stone-400">Status</th>
                <th className="py-2 px-3 text-left font-mono text-[9px] uppercase tracking-widest text-stone-400">Priority</th>
                <th className="py-2 px-3 text-left font-mono text-[9px] uppercase tracking-widest text-stone-400">Progress</th>
                <th className="py-2 px-3 text-left font-mono text-[9px] uppercase tracking-widest text-stone-400">Deadline</th>
                {!isMember && (
                  <th className="py-2 px-3 text-left font-mono text-[9px] uppercase tracking-widest text-stone-400">Assignee</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map(task => (
                <TaskRow
                  key={task.id}
                  task={task}
                  user={user}
                  users={users}
                  onUpdate={handleTaskUpdate}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isMember && (
        <p className="text-[10.5px] text-stone-300 mt-4 italic text-center">
          Only Chinny can mark a task Completed.
        </p>
      )}
    </div>
  );
}
