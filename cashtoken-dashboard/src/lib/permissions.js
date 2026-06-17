/**
 * Single source of truth for task status transitions.
 * Every role × task combination goes through here.
 */

export const ALL_STATUSES = [
  'pending',
  'in_progress',
  'ready_for_head_review',
  'ready_for_cmo_review',
  'completed',
];

export const STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In Progress',
  ready_for_head_review: 'Ready for Head Review',
  ready_for_cmo_review: 'Ready for CMO Review',
  completed: 'Completed',
};

export function canMarkCompleted(user) {
  return user?.role === 'cmo';
}

export function isAssistant(user) {
  return user?.secondary_role === 'assistant';
}

export function canSeeAllTasks(user) {
  return user?.role === 'cmo' || isAssistant(user);
}

export function canSeeTask(user, task) {
  if (canSeeAllTasks(user)) return true;
  if (user?.role === 'head') return task.category === user.category;
  return task.assignee_id === user?.id;
}

/**
 * Returns the status options to show in the dropdown for a given user+task.
 * Returns null if the user should see no dropdown (read-only).
 */
export function allowedStatusOptions(user, task) {
  if (!user || !task) return null;

  const isCMO = user.role === 'cmo';
  const isHead = user.role === 'head';
  const isMember = user.role === 'member';
  const isOwnTask = task.assignee_id === user.id;
  const isHeadOwnTask = isHead && isOwnTask;
  const isHeadTeamTask = isHead && task.category === user.category && !isOwnTask;

  // CMO: can approve or reject tasks at ready_for_cmo_review — handled via
  // dedicated buttons (completeTask action), not a dropdown.
  // Still allow CMO to update status directly via dropdown on any task.
  if (isCMO) {
    return ['pending', 'in_progress', 'ready_for_head_review', 'ready_for_cmo_review', 'completed'];
  }

  // Head viewing their own task — skip Head gate, go direct to CMO
  if (isHeadOwnTask) {
    return ['pending', 'in_progress', 'ready_for_cmo_review'];
  }

  // Head viewing a team member's task — approve/reject via buttons only,
  // but allow direct status editing for other transitions
  if (isHeadTeamTask) {
    // Only allow moving to ready_for_cmo_review (approve) or back to in_progress (reject)
    // when task is at head review. For other statuses, provide full editable range minus completed.
    return ['pending', 'in_progress', 'ready_for_head_review', 'ready_for_cmo_review'];
  }

  // Member viewing their own task
  if (isMember && isOwnTask) {
    return ['pending', 'in_progress', 'ready_for_head_review'];
  }

  // Everyone else: read-only
  return null;
}

/**
 * Returns true if the user can edit (change status of) this task.
 */
export function canEditTask(user, task) {
  return allowedStatusOptions(user, task) !== null;
}
