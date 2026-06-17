const CONFIG = {
  urgent: 'text-red-600 font-semibold',
  high:   'text-amber-700 font-semibold',
  medium: 'text-blue-600 font-medium',
  low:    'text-stone-400',
};

export default function PriorityBadge({ priority }) {
  const cls = CONFIG[priority] || 'text-stone-400';
  return (
    <span className={`text-[10px] uppercase tracking-wide ${cls}`}>
      {priority || '—'}
    </span>
  );
}
