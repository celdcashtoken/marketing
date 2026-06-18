import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { callApi } from '../lib/api';
import { useAuth } from '../lib/auth';

// ─── CMO Triage Card ────────────────────────────────────────────────────────

function TriageCard({ request, onTriaged }) {
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('medium');
  const [requestType, setRequestType] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleApprove() {
    if (!category) { setError('Select a category first.'); return; }
    if (!requestType) { setError('Select a request type.'); return; }
    setSubmitting(true);
    setError(null);
    const res = await callApi('approveRequest', {
      request_id: request.id,
      assigned_category: category,
      priority,
      request_type: requestType,
    });
    setSubmitting(false);
    if (res.ok) {
      onTriaged(request.id, { status: 'approved', assigned_category: category, priority, request_type: requestType });
    } else {
      setError(res.error || 'Failed to approve.');
    }
  }

  async function handleReject() {
    setSubmitting(true);
    const res = await callApi('update', {
      sheet: 'Requests',
      id: request.id,
      updates: { status: 'rejected' },
    });
    setSubmitting(false);
    if (res.ok) {
      onTriaged(request.id, { status: 'rejected' });
    }
  }

  const age = request.created_at
    ? Math.floor((Date.now() - new Date(request.created_at)) / 36e5) // hours
    : null;

  return (
    <div className="bg-white border border-stone-200 rounded-md overflow-hidden"
         style={{ borderLeft: '3px solid #B45309' }}>
      <div className="p-4">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center text-lg flex-shrink-0">📥</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-1 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-stone-100 text-stone-500">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />Awaiting triage
              </span>
              <span className="text-[10.5px] text-stone-400">
                From: {request.requester_department || '—'}
                {age !== null && ` · ${age < 1 ? 'just now' : age < 24 ? `${age}h ago` : `${Math.floor(age/24)}d ago`}`}
              </span>
            </div>
            <h3 className="font-semibold text-zinc-900 text-[14px] mb-1">{request.title}</h3>
            <p className="text-[12px] text-stone-500 leading-relaxed mb-3 line-clamp-3">
              "{request.description}"
            </p>

            {/* Triage form */}
            <div className="bg-stone-50 border border-stone-100 rounded-md p-3 mb-3">
              <div className="font-mono text-[9px] uppercase tracking-widest text-stone-400 mb-2">Triage decision</div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <div className="text-[10px] text-stone-400 mb-1">Category</div>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full border border-stone-200 rounded px-2 py-1.5 text-[11.5px] bg-white focus:outline-none focus:border-[#00C896]"
                  >
                    <option value="">— Choose —</option>
                    <option value="creatives">Creatives (Dapo)</option>
                    <option value="socials">Socials (Joan)</option>
                  </select>
                </div>
                <div>
                  <div className="text-[10px] text-stone-400 mb-1">Priority</div>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                    className="w-full border border-stone-200 rounded px-2 py-1.5 text-[11.5px] bg-white focus:outline-none focus:border-[#00C896]"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <div className="text-[10px] text-stone-400 mb-1">Type</div>
                  <select
                    value={requestType}
                    onChange={e => setRequestType(e.target.value)}
                    className="w-full border border-stone-200 rounded px-2 py-1.5 text-[11.5px] bg-white focus:outline-none focus:border-[#00C896]"
                  >
                    <option value="">— Choose —</option>
                    <option value="graphic">Graphic / layout</option>
                    <option value="video">Video</option>
                    <option value="social_post">Social post</option>
                    <option value="copywriting">Copywriting</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              {error && <div className="text-[10.5px] text-red-500 mt-2">{error}</div>}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={handleReject}
                disabled={submitting}
                className="px-3 py-1.5 text-[11px] font-medium text-red-600 border border-red-200 rounded-md bg-white hover:bg-red-50 disabled:opacity-40"
              >
                Reject
              </button>
              <button
                onClick={handleApprove}
                disabled={submitting}
                className="px-3 py-1.5 text-[11px] font-medium text-white bg-amber-700 rounded-md hover:bg-amber-800 disabled:opacity-40"
              >
                {submitting ? 'Routing…' : 'Approve & route to Head'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Head Assignment Card ────────────────────────────────────────────────────

function AssignCard({ request, users, onAssigned }) {
  const [assigneeId, setAssigneeId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Only show members of this Head's category
  const teammates = users.filter(
    u => u.role === 'member' && u.category === request.assigned_category
  );

  async function handleAssign() {
    if (!assigneeId) { setError('Select a team member.'); return; }
    setSubmitting(true);
    setError(null);

    // Create a Task linked to this request
    const taskId = 'tsk_' + Date.now().toString(36);
    const res = await callApi('create', {
      sheet: 'Tasks',
      data: {
        id: taskId,
        title: request.title,
        description: request.description,
        assignee_id: assigneeId,
        category: request.assigned_category,
        campaign: '',
        status: 'pending',
        priority: request.priority || 'medium',
        progress: 0,
        deadline: request.deadline || '',
        assigned_by_id: '',
        linked_request_id: request.id,
        rejection_feedback: '',
      },
    });

    if (res.ok) {
      // Mark the request as in_progress with the assignee
      await callApi('update', {
        sheet: 'Requests',
        id: request.id,
        updates: { status: 'in_progress', assigned_to_id: assigneeId },
      });
      setSubmitting(false);
      onAssigned(request.id, assigneeId);
    } else {
      setSubmitting(false);
      setError(res.error || 'Failed to assign.');
    }
  }

  const priorityColor = {
    urgent: 'text-red-600 bg-red-50',
    high: 'text-amber-700 bg-amber-50',
    medium: 'text-blue-600 bg-blue-50',
    low: 'text-stone-400 bg-stone-100',
  }[request.priority] || 'text-stone-400 bg-stone-100';

  return (
    <div className="bg-white border border-stone-200 rounded-md p-4">
      <div className="flex gap-3">
        <div className="w-9 h-9 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center text-base flex-shrink-0">📋</div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`text-[9.5px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded ${priorityColor}`}>
              {request.priority || 'medium'}
            </span>
            {request.request_type && (
              <span className="text-[10px] text-stone-400">{request.request_type.replace('_', ' ')}</span>
            )}
            {request.deadline && (
              <span className="text-[10px] text-stone-400">
                Due {new Date(request.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-zinc-900 text-[13.5px] mb-1">{request.title}</h3>
          <p className="text-[12px] text-stone-500 leading-relaxed mb-3 line-clamp-2">{request.description}</p>

          <div className="flex items-center gap-2">
            <select
              value={assigneeId}
              onChange={e => setAssigneeId(e.target.value)}
              className="flex-1 border border-stone-200 rounded px-2 py-1.5 text-[11.5px] bg-white focus:outline-none focus:border-[#00C896]"
            >
              <option value="">Assign to a team member…</option>
              {teammates.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            <button
              onClick={handleAssign}
              disabled={submitting || !assigneeId}
              className="px-3 py-1.5 text-[11px] font-medium text-white bg-slate-900 rounded-md hover:bg-black disabled:opacity-40 flex-shrink-0"
            >
              {submitting ? 'Assigning…' : 'Assign & create task'}
            </button>
          </div>
          {error && <div className="text-[10.5px] text-red-500 mt-1.5">{error}</div>}
        </div>
      </div>
    </div>
  );
}

// ─── Request Row (read-only, for in_progress / delivered) ───────────────────

function RequestRow({ request, users }) {
  const assignee = users.find(u => u.id === request.assigned_to_id);
  const statusConfig = {
    submitted:   { label: 'Awaiting triage', cls: 'bg-stone-100 text-stone-500' },
    approved:    { label: 'Awaiting assignment', cls: 'bg-amber-50 text-amber-700' },
    in_progress: { label: 'In progress', cls: 'bg-blue-50 text-blue-600' },
    completed:   { label: 'Delivered', cls: 'bg-emerald-50 text-emerald-700' },
    rejected:    { label: 'Rejected', cls: 'bg-red-50 text-red-500' },
  };
  const s = statusConfig[request.status] || statusConfig.submitted;

  return (
    <div className="bg-white border border-stone-200 rounded-md px-4 py-3 flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${s.cls}`}>{s.label}</span>
          <span className="text-[10.5px] text-stone-400">{request.requester_department}</span>
        </div>
        <div className="font-medium text-zinc-900 text-[13px]">{request.title}</div>
        {assignee && (
          <div className="text-[10.5px] text-stone-400 mt-0.5">Assigned to {assignee.name}</div>
        )}
      </div>
      {request.deadline && (
        <div className="text-[10.5px] text-stone-400 flex-shrink-0">
          {new Date(request.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function Requests() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState('triage');

  const isCMO = user?.role === 'cmo';
  const isAssistant = user?.secondary_role === 'assistant';
  const isHead = user?.role === 'head';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['all'],
    queryFn: () => callApi('getAll'),
    refetchInterval: 15000,
    staleTime: 10000,
  });

  const allRequests = data?.data?.requests || [];
  const users = data?.data?.users || [];

  // Scope requests by role
  const visibleRequests = isCMO || isAssistant
    ? allRequests
    : isHead
    ? allRequests.filter(r => r.assigned_category === user.category)
    : [];

  const triageQueue = visibleRequests.filter(r => r.status === 'submitted');
  const toAssign    = visibleRequests.filter(r => r.status === 'approved' && (isCMO || isAssistant || r.assigned_category === user?.category));
  const inProgress  = visibleRequests.filter(r => r.status === 'in_progress');
  const delivered   = visibleRequests.filter(r => r.status === 'completed' || r.status === 'rejected');

  function updateRequest(id, updates) {
    qc.setQueryData(['all'], old => {
      if (!old?.data?.requests) return old;
      return {
        ...old,
        data: {
          ...old.data,
          requests: old.data.requests.map(r => r.id === id ? { ...r, ...updates } : r),
        },
      };
    });
  }

  // Default tab for Heads: show "to assign" first
  const tabs = isCMO || isAssistant
    ? [
        { id: 'triage',      label: `🔥 Needs triage`,   count: triageQueue.length },
        { id: 'assign',      label: 'Awaiting assignment', count: toAssign.length },
        { id: 'in_progress', label: 'In progress',          count: inProgress.length },
        { id: 'delivered',   label: 'Delivered',            count: delivered.length },
      ]
    : [
        { id: 'assign',      label: 'To assign',   count: toAssign.length },
        { id: 'in_progress', label: 'In progress', count: inProgress.length },
        { id: 'delivered',   label: 'Delivered',   count: delivered.length },
      ];

  const activeTab = tabs.find(t => t.id === tab) ? tab : tabs[0]?.id;

  return (
    <div className="p-6">
      <div className="flex items-end justify-between mb-5">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-zinc-900">Requests</h1>
          <p className="text-[12px] text-stone-400 mt-0.5">
            {triageQueue.length > 0
              ? `${triageQueue.length} awaiting triage · ${inProgress.length} in progress`
              : `${inProgress.length} in progress · ${delivered.length} delivered`}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-stone-200 mb-5">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3.5 py-2 text-[12.5px] border-b-2 -mb-px transition-colors ${
              activeTab === t.id
                ? 'border-[#00C896] text-zinc-900 font-medium'
                : 'border-transparent text-stone-400 hover:text-zinc-700'
            }`}
          >
            {t.label}
            <span className="ml-1.5 font-mono text-[9px] text-stone-300">{t.count}</span>
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-stone-200 border-t-[#00C896] rounded-full animate-spin" />
        </div>
      )}

      {isError && (
        <div className="text-center py-16 text-stone-400 text-sm">Failed to load requests.</div>
      )}

      {!isLoading && !isError && (
        <div className="space-y-3">
          {activeTab === 'triage' && (
            triageQueue.length === 0
              ? <Empty label="No requests awaiting triage." />
              : triageQueue.map(r => (
                  <TriageCard key={r.id} request={r} onTriaged={updateRequest} />
                ))
          )}

          {activeTab === 'assign' && (
            toAssign.length === 0
              ? <Empty label="No approved requests to assign." />
              : toAssign.map(r => (
                  <AssignCard key={r.id} request={r} users={users} onAssigned={(id, assigneeId) => updateRequest(id, { status: 'in_progress', assigned_to_id: assigneeId })} />
                ))
          )}

          {activeTab === 'in_progress' && (
            inProgress.length === 0
              ? <Empty label="No requests currently in progress." />
              : inProgress.map(r => <RequestRow key={r.id} request={r} users={users} />)
          )}

          {activeTab === 'delivered' && (
            delivered.length === 0
              ? <Empty label="Nothing delivered yet." />
              : delivered.map(r => <RequestRow key={r.id} request={r} users={users} />)
          )}
        </div>
      )}
    </div>
  );
}

function Empty({ label }) {
  return (
    <div className="text-center py-16">
      <div className="text-stone-300 text-4xl mb-3">📭</div>
      <div className="text-stone-400 text-sm">{label}</div>
    </div>
  );
}
