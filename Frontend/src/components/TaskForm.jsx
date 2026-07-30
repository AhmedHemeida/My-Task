import { useState } from 'react';
import { CircleAlert, Loader2 } from 'lucide-react';
import { getErrorMessage } from '../api';
import { priorities, statuses } from '../taskMeta';

export default function TaskForm({ task, people, onSubmit, onClose }) {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'Todo',
    priority: task?.priority || 'Medium',
    dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : '',
    assignee: task?.assignee?._id || '',
  });
  const [titleError, setTitleError] = useState('');
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm({ ...form, [field]: value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.title.trim()) {
      setTitleError('Title is required');
      return;
    }

    setServerError('');
    setSaving(true);
    try {
      await onSubmit({
        title: form.title.trim(),
        description: form.description.trim(),
        status: form.status,
        priority: form.priority,
        dueDate: form.dueDate || null,
        assignee: form.assignee || null,
      });
    } catch (error) {
      setServerError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {serverError && (
        <div role="alert" className="flex items-start gap-2 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {serverError}
        </div>
      )}

      <div>
        <label htmlFor="task-title" className="label">
          Title
        </label>
        <input
          id="task-title"
          type="text"
          className={`field ${titleError ? 'field-error' : ''}`}
          placeholder="Design the landing page"
          value={form.title}
          onChange={(event) => {
            update('title', event.target.value);
            setTitleError('');
          }}
          aria-invalid={Boolean(titleError)}
          aria-describedby={titleError ? 'task-title-error' : undefined}
        />
        {titleError && (
          <p id="task-title-error" className="mt-1 text-sm text-danger">
            {titleError}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="task-description" className="label">
          Description
        </label>
        <textarea
          id="task-description"
          rows={3}
          className="field h-auto py-2"
          placeholder="Add any useful details"
          value={form.description}
          onChange={(event) => update('description', event.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="task-status" className="label">
            Status
          </label>
          <select
            id="task-status"
            className="field"
            value={form.status}
            onChange={(event) => update('status', event.target.value)}
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="task-priority" className="label">
            Priority
          </label>
          <select
            id="task-priority"
            className="field"
            value={form.priority}
            onChange={(event) => update('priority', event.target.value)}
          >
            {priorities.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="task-due-date" className="label">
            Due date
          </label>
          <input
            id="task-due-date"
            type="date"
            className="field"
            value={form.dueDate}
            onChange={(event) => update('dueDate', event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="task-assignee" className="label">
            Assignee
          </label>
          <select
            id="task-assignee"
            className="field"
            value={form.assignee}
            onChange={(event) => update('assignee', event.target.value)}
          >
            <option value="">Unassigned</option>
            {people.map((person) => (
              <option key={person._id} value={person._id}>
                {person.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {task ? 'Save changes' : 'Create task'}
        </button>
      </div>
    </form>
  );
}
