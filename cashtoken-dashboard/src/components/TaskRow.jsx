import { useState } from 'react';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import { allowedStatusOptions, STATUS_LABELS } from '../lib/permissions';
import { callApi } from '../lib/api';

function formatDeadline(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const now = new Date();
  const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: 'Overdue', urgent: true };
  if (diffDays === 0) return { label: 'Today', urgent: true };
  if (diffDays === 1) return { label: 'Tomorrow', warn: true };
  return { label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) };
}

export default function TaskRow({ task, user, users = [], onUpdate }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const options = allowedStatusOptions(user, task);
  const isReadOnly = options === null;

  const assignee = users.find(u => u.id === task.assignee_id);
  const deadline = formatDeadline(task.deadline);
  const deadlineLabel = typeof deadline === 'string' ? deadline : deadline.label;
  const deadlineClass = typeof deadline === 'object'
    ? deadline.urgent ? 'text-red-600 font-medium' : deadline.warn ? 'text-amber-700' : 'text-stone-400'
    : 'text-stone-400';

  async function handleStatusChange(e) {
    const newStatus = e.target.value;
    if (newStatus === task.status) return;
    setSaving(true);
    setError(null);
    const res = await callApi('update', { sheet: 'Tasks', id: task.id, updates: { status: newStatus } });
    setSaving(false);
    if (res.ok) {
      onUpdate?.({ ...task, status: newStatus });
    } else {
      setError('Failed to save');
    }
  }

  return (
    <tr className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
      <td className="py-2.5 px-3">
        <div className="font-medium text-zinc-900 text-[12.5px] leading-tight">{task.title}</div>
        {task.campaign && (
          <div className="text-[10px] text-stone-400 mt-0.5">{task.campaign}</div>
        )}
      </td>

      <td className="py-2.5 px-3">
        {isReadOnly ? (
          <StatusBadge status={task.status} />
        ) : (
          <div className="relative">
            <select
              value={task.status}
              onChange={handleStatusChange}
              disabled={saving}
              className="appearance-none text-[11px] border border-stone-200 rounded px-2 py-1 pr-6 bg-white text-zinc-700 cursor-pointer focus:outline-none focus:border-[#00C896] disabled:opacity-50"
            >
              {options.map(s => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-stone-400 text-[10px]">▾</span>
            {error && <div className="text-[10px] text-red-500 mt-0.5">{error}</div>}
          </div>
        )}
      </td>

      <td className="py-2.5 px-3">
        <PriorityBadge priority={task.priority} />
      </td>

      <td className="py-2.5 px-3">
        <div className="flex items-center gap-1.5">
          <div className="w-14 h-[3px] bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#00C896] rounded-full"
              style={{ width: `${task.progress || 0}%` }}
            />
          </div>
          <span className="font-mono text-[10px] text-stone-400">{task.progress || 0}%</span>
        </div>
      </td>

      <td className="py-2.5 px-3">
        <span className={`text-[11px] ${deadlineClass}`}>{deadlineLabel}</span>
      </td>

      {user.role !== 'member' && (
        <td className="py-2.5 px-3">
          {assignee ? (
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-stone-200 flex items-center justify-center text-[9px] font-semibold text-stone-600 flex-shrink-0">
                {assignee.avatar || assignee.name?.[0]?.toUpperCase()}
              </div>
              <span className="text-[11px] text-stone-600">{assignee.name}</span>
            </div>
          ) : (
            <span className="text-[11px] text-stone-300">—</span>
          )}
        </td>
      )}
    </tr>
  );
}
