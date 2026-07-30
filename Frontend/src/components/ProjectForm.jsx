import { useState } from 'react';
import { CircleAlert, Loader2 } from 'lucide-react';
import { getErrorMessage } from '../api';

export default function ProjectForm({ project, onSubmit, onClose }) {
  const [form, setForm] = useState({
    name: project?.name || '',
    description: project?.description || '',
  });
  const [nameError, setNameError] = useState('');
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.name.trim()) {
      setNameError('Project name is required');
      return;
    }

    setServerError('');
    setSaving(true);
    try {
      await onSubmit({ name: form.name.trim(), description: form.description.trim() });
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
        <label htmlFor="project-name" className="label">
          Project name
        </label>
        <input
          id="project-name"
          type="text"
          className={`field ${nameError ? 'field-error' : ''}`}
          placeholder="Website Redesign"
          value={form.name}
          onChange={(event) => {
            setForm({ ...form, name: event.target.value });
            setNameError('');
          }}
          aria-invalid={Boolean(nameError)}
          aria-describedby={nameError ? 'project-name-error' : undefined}
        />
        {nameError && (
          <p id="project-name-error" className="mt-1 text-sm text-danger">
            {nameError}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="project-description" className="label">
          Description
        </label>
        <textarea
          id="project-description"
          rows={3}
          className="field h-auto py-2"
          placeholder="What is this project about?"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
        />
      </div>

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {project ? 'Save changes' : 'Create project'}
        </button>
      </div>
    </form>
  );
}
