const CONFIG = {
  pending: {
    label: 'Pending',
    cls: 'bg-stone-100 text-stone-600',
    dot: 'bg-stone-400',
  },
  in_progress: {
    label: 'In Progress',
    cls: 'bg-blue-50 text-blue-600',
    dot: 'bg-blue-500',
  },
  ready_for_head_review: {
    label: 'Head Review',
    cls: 'bg-amber-50 text-amber-700',
    dot: 'bg-amber-500',
  },
  ready_for_cmo_review: {
    label: 'CMO Review',
    cls: 'bg-amber-50 text-amber-700 border border-yellow-300',
    dot: 'bg-amber-500',
  },
  completed: {
    label: 'Completed',
    cls: 'bg-emerald-50 text-emerald-700',
    dot: 'bg-emerald-500',
  },
};

export default function StatusBadge({ status }) {
  const cfg = CONFIG[status] || { label: status, cls: 'bg-stone-100 text-stone-500', dot: 'bg-stone-400' };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium leading-5 ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
