import { useState } from 'react';
import { callApi } from '../lib/api';

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

export default function PublicRequest() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    deadline: '',
    requester_department: '',
    requester_email: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const { title, description, deadline, requester_department, requester_email } = form;
    if (!title.trim() || !description.trim() || !deadline || !requester_department.trim() || !requester_email.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    setError(null);

    const res = await callApi('create', {
      sheet: 'Requests',
      data: {
        id: 'req_' + Date.now().toString(36),
        title: title.trim(),
        description: description.trim(),
        requester_department: requester_department.trim(),
        requester_email: requester_email.trim().toLowerCase(),
        request_type: '',
        assigned_category: '',
        assigned_to_id: '',
        priority: '',
        status: 'submitted',
        deadline,
        attachments: '',
      },
    });

    setSubmitting(false);
    if (res.ok) {
      setSubmitted(true);
    } else {
      setError('Failed to submit. Please try again.');
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-start justify-center pt-20 px-4">
        <div className="max-w-md w-full bg-white border border-stone-200 rounded-xl p-10 text-center">
          <div className="text-5xl mb-4">✓</div>
          <h2 className="text-xl font-semibold text-zinc-900 mb-2">Request submitted</h2>
          <p className="text-stone-500 text-sm leading-relaxed">
            Our CMO will review your request and route it to the right team within 24 hours.
            You'll hear from us at <strong>{form.requester_email}</strong>.
          </p>
          <button
            onClick={() => { setSubmitted(false); setForm({ title: '', description: '', deadline: '', requester_department: '', requester_email: '' }); }}
            className="mt-6 text-[12px] text-stone-400 hover:text-zinc-900 underline underline-offset-2"
          >
            Submit another request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-start justify-center pt-16 px-4 pb-16">
      <div className="max-w-[560px] w-full bg-white border border-stone-200 rounded-xl p-8">
        {/* Brand */}
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-8 h-8 bg-[#00C896] rounded-md flex items-center justify-center flex-shrink-0">
            <div className="w-4 h-4 bg-white rounded-sm" />
          </div>
          <div>
            <div className="font-semibold text-zinc-900 text-[13px] leading-tight">CashToken Marketing</div>
            <div className="font-mono text-[8px] uppercase tracking-widest text-stone-400">Request portal</div>
          </div>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 mb-1.5">
          Submit a marketing request
        </h1>
        <p className="text-stone-500 text-[13.5px] mb-6 leading-relaxed">
          Tell us what you need. Our CMO will review and route it to the right team within 24 hours.
        </p>

        {error && (
          <div className="mb-4 px-3 py-2 bg-red-50 border border-red-100 rounded-md text-[11.5px] text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Field label="Request title" required>
            <input
              type="text"
              value={form.title}
              onChange={set('title')}
              placeholder="e.g. Year-end report design"
              className="w-full border border-stone-200 rounded-md px-3 py-2 text-[12.5px] text-zinc-800 placeholder:text-stone-300 focus:outline-none focus:border-[#00C896]"
            />
          </Field>

          <Field label="Description" required help="What do you need? Who's it for? Any brand requirements?">
            <textarea
              value={form.description}
              onChange={set('description')}
              rows={4}
              placeholder="Describe what you need in as much detail as possible…"
              className="w-full border border-stone-200 rounded-md px-3 py-2 text-[12.5px] text-zinc-800 placeholder:text-stone-300 focus:outline-none focus:border-[#00C896] resize-none"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Deadline" required>
              <input
                type="date"
                value={form.deadline}
                onChange={set('deadline')}
                className="w-full border border-stone-200 rounded-md px-3 py-2 text-[12.5px] text-zinc-800 focus:outline-none focus:border-[#00C896]"
              />
            </Field>
            <Field label="Your department" required>
              <input
                type="text"
                value={form.requester_department}
                onChange={set('requester_department')}
                placeholder="e.g. Finance"
                className="w-full border border-stone-200 rounded-md px-3 py-2 text-[12.5px] text-zinc-800 placeholder:text-stone-300 focus:outline-none focus:border-[#00C896]"
              />
            </Field>
          </div>

          <Field label="Your email" required>
            <input
              type="email"
              value={form.requester_email}
              onChange={set('requester_email')}
              placeholder="you@cashtokenrewards.com"
              className="w-full border border-stone-200 rounded-md px-3 py-2 text-[12.5px] text-zinc-800 placeholder:text-stone-300 focus:outline-none focus:border-[#00C896]"
            />
          </Field>

          <Field label="Attachment (optional)">
            <div className="border-2 border-dashed border-stone-200 rounded-md px-4 py-5 text-center text-[12px] text-stone-400 bg-stone-50">
              📎 Drag a file here or click to browse · max 20 MB
              <div className="text-[10px] mt-1 text-stone-300">(File upload not yet connected)</div>
            </div>
          </Field>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 text-[13px] font-medium text-white bg-slate-900 rounded-md hover:bg-black disabled:opacity-50 mt-2"
          >
            {submitting ? 'Submitting…' : 'Submit request'}
          </button>

          <p className="text-[11px] text-stone-400 text-center mt-4">
            Decisions about which team handles your request are made by our CMO during triage.
          </p>
        </form>
      </div>
    </div>
  );
}
