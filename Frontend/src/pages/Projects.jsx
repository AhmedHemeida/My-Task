import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CircleAlert, FolderKanban, Pencil, Plus, RotateCw, Search, Trash2, Users } from 'lucide-react';
import api, { getErrorMessage } from '../api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import ProjectForm from '../components/ProjectForm';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import Toast from '../components/Toast';

const sortOptions = [
  { value: '-createdAt', label: 'Newest first' },
  { value: 'createdAt', label: 'Oldest first' },
  { value: 'name', label: 'Name A to Z' },
  { value: '-name', label: 'Name Z to A' },
];

export default function Projects() {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('-createdAt');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/projects', {
        params: { page, sort, limit: 9, search: search || undefined },
      });
      setProjects(res.data.items);
      setMeta({ page: res.data.page, totalPages: res.data.totalPages, total: res.data.total });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, sort, search]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreateForm() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEditForm(project) {
    setEditing(project);
    setFormOpen(true);
  }

  async function saveProject(data) {
    if (editing) {
      await api.put(`/projects/${editing._id}`, data);
      setToast({ message: 'Project updated', type: 'success' });
    } else {
      await api.post('/projects', data);
      setToast({ message: 'Project created', type: 'success' });
    }
    setFormOpen(false);
    await load();
  }

  async function deleteProject() {
    try {
      await api.delete(`/projects/${deleting._id}`);
      setToast({ message: 'Project deleted', type: 'success' });
      setDeleting(null);
      if (projects.length === 1 && page > 1) setPage(page - 1);
      else await load();
    } catch (err) {
      setToast({ message: getErrorMessage(err), type: 'error' });
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="mt-1 text-sm text-muted">Projects you have access to.</p>
        </div>
        {isAdmin && (
          <button type="button" className="btn btn-primary" onClick={openCreateForm}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            New project
          </button>
        )}
      </div>

      <div className="card flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="project-search" className="label">
            Search
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              id="project-search"
              type="search"
              className="field pl-9"
              placeholder="Search by name or description"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>
        </div>

        <div className="sm:w-52">
          <label htmlFor="project-sort" className="label">
            Sort by
          </label>
          <select
            id="project-sort"
            className="field"
            value={sort}
            onChange={(event) => {
              setSort(event.target.value);
              setPage(1);
            }}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-40 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div role="alert" className="card flex flex-col items-center gap-3 text-center">
          <CircleAlert className="h-8 w-8 text-danger" aria-hidden="true" />
          <p className="text-sm text-muted">{error}</p>
          <button type="button" className="btn btn-secondary" onClick={load}>
            <RotateCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </button>
        </div>
      )}

      {!loading && !error && projects.length === 0 && search && (
        <EmptyState
          icon={Search}
          title="No projects match your search"
          description={`Nothing found for "${search}". Try a different word.`}
          action={
            <button type="button" className="btn btn-secondary" onClick={() => setSearchInput('')}>
              Clear search
            </button>
          }
        />
      )}

      {!loading && !error && projects.length === 0 && !search && (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description={
            isAdmin
              ? 'Create your first project and add members to it.'
              : 'You will see projects here once an admin adds you to one.'
          }
          action={
            isAdmin && (
              <button type="button" className="btn btn-primary" onClick={openCreateForm}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                New project
              </button>
            )
          }
        />
      )}

      {!loading && !error && projects.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <li key={project._id} className="card flex flex-col">
              <Link to={`/projects/${project._id}`} className="group">
                <h2 className="font-semibold group-hover:text-primary">{project.name}</h2>
                <p className="mt-2 line-clamp-2 text-sm text-muted">
                  {project.description || 'No description provided.'}
                </p>
              </Link>

              <div className="mt-4 flex items-center gap-2 text-sm text-muted">
                <Users className="h-4 w-4" aria-hidden="true" />
                <span className="tabular-nums">{project.members.length}</span>
                <span>{project.members.length === 1 ? 'member' : 'members'}</span>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
                <Link to={`/projects/${project._id}`} className="text-sm font-medium text-primary hover:underline">
                  Open project
                </Link>

                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="btn btn-ghost h-11 w-11 px-0"
                      aria-label={`Edit ${project.name}`}
                      onClick={() => openEditForm(project)}
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost h-11 w-11 px-0 hover:text-danger"
                      aria-label={`Delete ${project.name}`}
                      onClick={() => setDeleting(project)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {!loading && !error && projects.length > 0 && (
        <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} />
      )}

      {formOpen && (
        <Modal title={editing ? 'Edit project' : 'New project'} onClose={() => setFormOpen(false)}>
          <ProjectForm project={editing} onSubmit={saveProject} onClose={() => setFormOpen(false)} />
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete project"
          message={`"${deleting.name}" and all of its tasks will be permanently deleted.`}
          onConfirm={deleteProject}
          onClose={() => setDeleting(null)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
