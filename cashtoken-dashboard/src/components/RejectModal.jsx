import { useState } from 'react';
import { X } from 'lucide-react';

export default function RejectModal({ task, onConfirm, onCancel, submitting }) {
  const [feedback, setFeedback] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4"
         style={{ background: 'rgba(15,23,42,0.4)' }}>
      <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
          <div>
            <div className="font-semibold text-zinc-900 text-sm">Reject task</div>
            <div className="text-[11px] text-stone-400 mt-0.5 truncate max-w-xs">{task.title}</div>
          </div>
          <button onClick={onCancel} className="text-stone-400 hover:text-zinc-900 p-1">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4">
          <label className="block font-mono text-[9.5px] uppercase tracking-widest text-stone-400 mb-2">
            Feedback for the assignee
          </label>
          <textarea
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            rows={4}
            placeholder="What needs to be fixed or improved?"
            className="w-full border border-stone-200 rounded-md px-3 py-2 text-[12.5px] text-zinc-800 placeholder:text-stone-300 focus:outline-none focus:border-[#00C896] resize-none"
          />
          <p className="text-[10.5px] text-stone-400 mt-2">
            The task will return to <strong>In Progress</strong> with this feedback attached.
          </p>
        </div>

        <div className="flex justify-end gap-2 px-5 py-3 bg-stone-50 border-t border-stone-200">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="px-3 py-1.5 text-[12px] font-medium text-stone-600 border border-stone-200 rounded-md bg-white hover:bg-stone-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(feedback)}
            disabled={submitting || !feedback.trim()}
            className="px-3 py-1.5 text-[12px] font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-40"
          >
            {submitting ? 'Rejecting…' : 'Reject & send back'}
          </button>
        </div>
      </div>
    </div>
  );
}
