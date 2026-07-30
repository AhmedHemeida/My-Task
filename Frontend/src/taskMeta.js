export const statuses = ['Todo', 'In Progress', 'Done'];
export const priorities = ['Low', 'Medium', 'High'];

export const statusStyles = {
  Todo: 'bg-slate-100 text-slate-700',
  'In Progress': 'bg-primary-soft text-primary',
  Done: 'bg-success-soft text-success',
};

export const priorityStyles = {
  Low: 'bg-slate-100 text-slate-700',
  Medium: 'bg-amber-100 text-amber-800',
  High: 'bg-danger-soft text-danger',
};

export function formatDate(value) {
  if (!value) return 'No due date';
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function isOverdue(task) {
  return Boolean(task.dueDate) && task.status !== 'Done' && new Date(task.dueDate) < new Date();
}
