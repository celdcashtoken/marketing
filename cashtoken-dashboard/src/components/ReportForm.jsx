import { useState } from 'react';
import { X } from 'lucide-react';
import { callApi } from '../lib/api';
import { useAuth } from '../lib/auth';

function getWeekStart() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}

function Field({ label, required, children, help }) {
  return (
    <div className="mb-4">
      <label className="block font-mono text-[9.5px] uppercase tracking-widest text-stone-400 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {help && <p className="text-[10.5px] text-stone-400 mt-1">{help}</p>}
    </div>
  );
}

export default function ReportForm({ onClose, onSuccess }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    tasks_completed: '',
    challenges: '',
    pending_tasks: '',
    support_needed: '',
    suggestions: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.tasks_completed.trim()) {
      setError('Please describe the tasks you completed this week.');
      return;
    }
    setSubmitting(true);
    setError(null);

    const weekStart = getWeekStart();
    const id = 'rpt_' + Date.now().toString(36);

    const res = await callApi('create', {
      sheet: 'Reports',
      data: {
        id,
        user_id: user.id,
        category: user.category,
        week_start: weekStart,
        tasks_completed: form.tasks_completed,
        challenges: form.challenges,
        pending_tasks: form.pending_tasks,
        support_needed: form.support_needed,
        suggestions: form.suggestions,
        submitted_at: new Date().toISOString(),
      },
    });

    setSubmitting(false);
    if (res.ok) {
      onSuccess?.();
    } else {
      setError(res.error || 'Failed to submit. Please try again.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 px-4 pb-8 overflow-y-auto"
         style={{ background: 'rgba(15,23,42,0.4)' }}>
      <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden shadow-xl my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
          <div>
            <div className="font-semibold text-zinc-900 text-sm">Weekly report</div>
            <div className="text-[11px] text-stone-400 mt-0.5">
              Week of {new Date(getWeekStart()).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-zinc-900 p-1">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5">
          {error && (
            <div className="mb-4 px-3 py-2 bg-red-50 border border-red-100 rounded-md text-[11.5px] text-red-600">
              {error}
            </div>
          )}

          <Field label="Tasks completed this week" required
            help="List the tasks you finished, even partially completed ones.">
            <textarea
              value={form.tasks_completed}
              onChange={set('tasks_completed')}
              rows={3}
              placeholder="e.g. Finished Q4 banner designs, reviewed brand guidelines draft…"
              className="w-full border border-stone-200 rounded-md px-3 py-2 text-[12.5px] text-zinc-800 placeholder:text-stone-300 focus:outline-none focus:border-[#00C896] resize-none"
            />
          </Field>

          <Field label="Challenges & blockers"
            help="Anything that slowed you down or is still unresolved.">
            <textarea
              value={form.challenges}
              onChange={set('challenges')}
              rows={2}
              placeholder="e.g. Waiting on brand assets from the client…"
              className="w-full border border-stone-200 rounded-md px-3 py-2 text-[12.5px] text-zinc-800 placeholder:text-stone-300 focus:outline-none focus:border-[#00C896] resize-none"
            />
          </Field>

          <Field label="Tasks still pending"
            help="Work carried over to next week.">
            <textarea
              value={form.pending_tasks}
              onChange={set('pending_tasks')}
              rows={2}
              placeholder="e.g. Animation final export, landing page copy review…"
              className="w-full border border-stone-200 rounded-md px-3 py-2 text-[12.5px] text-zinc-800 placeholder:text-stone-300 focus:outline-none focus:border-[#00C896] resize-none"
            />
          </Field>

          <Field label="Support needed"
            help="What do you need from your Head or the CMO?">
            <textarea
              value={form.support_needed}
              onChange={set('support_needed')}
              rows={2}
              placeholder="e.g. Need clarity on the Q4 colour palette decision…"
              className="w-full border border-stone-200 rounded-md px-3 py-2 text-[12.5px] text-zinc-800 placeholder:text-stone-300 focus:outline-none focus:border-[#00C896] resize-none"
            />
          </Field>

          <Field label="Suggestions">
            <textarea
              value={form.suggestions}
              onChange={set('suggestions')}
              rows={2}
              placeholder="Any ideas to improve how the team works?"
              className="w-full border border-stone-200 rounded-md px-3 py-2 text-[12.5px] text-zinc-800 placeholder:text-stone-300 focus:outline-none focus:border-[#00C896] resize-none"
            />
          </Field>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-3 py-1.5 text-[12px] font-medium text-stone-600 border border-stone-200 rounded-md bg-white hover:bg-stone-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 text-[12px] font-medium text-white bg-slate-900 rounded-md hover:bg-black disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
