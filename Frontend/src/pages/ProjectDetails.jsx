import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  CircleAlert,
  ListTodo,
  Pencil,
  Plus,
  RotateCw,
  Search,
  Trash2,
  User,
} from 'lucide-react';
import api, { getErrorMessage } from '../api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import TaskForm from '../components/TaskForm';
import MembersPanel from '../components/MembersPanel';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import Toast from '../components/Toast';
import { formatDate, isOverdue, priorities, priorityStyles, statuses, statusStyles } from '../taskMeta';

const emptyFilters = { status: '', priority: '', assignee: '' };

const sortOptions = [
  { value: '-createdAt', label: 'Newest first' },
  { value: 'dueDate', label: 'Due date' },
  { value: 'title', label: 'Title' },
  { value: 'status', label: 'Status' },
];

export default function ProjectDetails() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState(emptyFilters);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('-createdAt');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);
  const [toast, setToast] = useState(null);

  const loadProject = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/projects/${id}`);
      setProject(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadTasks = useCallback(async () => {
    setTasksLoading(true);
    try {
      const res = await api.get('/tasks', {
        params: {
          project: id,
          status: filters.status || undefined,
          priority: filters.priority || undefined,
          assignee: filters.assignee || undefined,
          search: search || undefined,
          sort,
          page,
          limit: 8,
        },
      });
      setTasks(res.data.items);
      setMeta({ page: res.data.page, totalPages: res.data.totalPages, total: res.data.total });
    } catch (err) {
      setToast({ message: getErrorMessage(err), type: 'error' });
    } finally {
      setTasksLoading(false);
    }
  }, [id, filters, search, sort, page]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (project) loadTasks();
  }, [project, loadTasks]);

  async function saveTask(data) {
    if (editingTask) {
      await api.put(`/tasks/${editingTask._id}`, data);
      setToast({ message: 'Task updated', type: 'success' });
    } else {
      await api.post('/tasks', { ...data, project: id });
      setToast({ message: 'Task created', type: 'success' });
    }
    setFormOpen(false);
    await loadTasks();
  }

  async function changeStatus(task, status) {
    try {
      await api.put(`/tasks/${task._id}`, { status });
      await loadTasks();
    } catch (err) {
      setToast({ message: getErrorMessage(err), type: 'error' });
    }
  }

  async function deleteTask() {
    try {
      await api.delete(`/tasks/${deletingTask._id}`);
      setToast({ message: 'Task deleted', type: 'success' });
      setDeletingTask(null);
      if (tasks.length === 1 && page > 1) setPage(page - 1);
      else await loadTasks();
    } catch (err) {
      setToast({ message: getErrorMessage(err), type: 'error' });
      setDeletingTask(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-24 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-96 animate-pulse rounded-xl bg-slate-200" />
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="card flex flex-col items-center gap-3 text-center">
        <CircleAlert className="h-8 w-8 text-danger" aria-hidden="true" />
        <p className="text-sm text-muted">{error}</p>
        <div className="flex gap-2">
          <Link to="/projects" className="btn btn-secondary">
            Back to projects
          </Link>
          <button type="button" className="btn btn-primary" onClick={loadProject}>
            <RotateCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  const people = [project.owner, ...project.members];
  const hasQuery = Boolean(filters.status || filters.priority || filters.assignee || search);

  function clearQuery() {
    setFilters(emptyFilters);
    setSearchInput('');
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <Link to="/projects" className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to projects
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            {project.description || 'No description provided.'}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary shrink-0"
          onClick={() => {
            setEditingTask(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New task
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="card space-y-3">
            <div>
              <label htmlFor="task-search" className="label">
                Search
              </label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                  aria-hidden="true"
                />
                <input
                  id="task-search"
                  type="search"
                  className="field pl-9"
                  placeholder="Search by title or description"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label htmlFor="filter-status" className="label">
                  Status
                </label>
                <select
                  id="filter-status"
                  className="field"
                  value={filters.status}
                  onChange={(event) => {
                    setFilters({ ...filters, status: event.target.value });
                    setPage(1);
                  }}
                >
                  <option value="">All statuses</option>
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="filter-priority" className="label">
                  Priority
                </label>
                <select
                  id="filter-priority"
                  className="field"
                  value={filters.priority}
                  onChange={(event) => {
                    setFilters({ ...filters, priority: event.target.value });
                    setPage(1);
                  }}
                >
                  <option value="">All priorities</option>
                  {priorities.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="filter-assignee" className="label">
                  Assignee
                </label>
                <select
                  id="filter-assignee"
                  className="field"
                  value={filters.assignee}
                  onChange={(event) => {
                    setFilters({ ...filters, assignee: event.target.value });
                    setPage(1);
                  }}
                >
                  <option value="">Everyone</option>
                  {people.map((person) => (
                    <option key={person._id} value={person._id}>
                      {person.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="task-sort" className="label">
                  Sort by
                </label>
                <select
                  id="task-sort"
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

            {hasQuery && (
              <button type="button" className="btn btn-secondary sm:w-fit" onClick={clearQuery}>
                Clear filters
              </button>
            )}
          </div>

          {tasksLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-28 animate-pulse rounded-xl bg-slate-200" />
              ))}
            </div>
          )}

          {!tasksLoading && tasks.length === 0 && (
            <EmptyState
              icon={ListTodo}
              title={hasQuery ? 'No tasks match these filters' : 'No tasks yet'}
              description={
                hasQuery
                  ? 'Try clearing the filters to see the rest of the tasks.'
                  : 'Create the first task to get this project moving.'
              }
              action={
                hasQuery ? (
                  <button type="button" className="btn btn-secondary" onClick={clearQuery}>
                    Clear filters
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      setEditingTask(null);
                      setFormOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    New task
                  </button>
                )
              }
            />
          )}

          {!tasksLoading && tasks.length > 0 && (
            <ul className="space-y-3">
              {tasks.map((task) => (
                <li key={task._id} className="card">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="font-medium">{task.title}</h3>
                      {task.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-muted">{task.description}</p>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                        <span className={`badge ${statusStyles[task.status]}`}>{task.status}</span>
                        <span className={`badge ${priorityStyles[task.priority]}`}>{task.priority} priority</span>
                        <span
                          className={`flex items-center gap-1 ${isOverdue(task) ? 'font-medium text-danger' : 'text-muted'}`}
                        >
                          <CalendarDays className="h-4 w-4" aria-hidden="true" />
                          {formatDate(task.dueDate)}
                          {isOverdue(task) && ' (overdue)'}
                        </span>
                        <span className="flex items-center gap-1 text-muted">
                          <User className="h-4 w-4" aria-hidden="true" />
                          {task.assignee ? task.assignee.name : 'Unassigned'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        className="field w-auto text-sm"
                        aria-label={`Change status of ${task.title}`}
                        value={task.status}
                        onChange={(event) => changeStatus(task, event.target.value)}
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        className="btn btn-ghost h-11 w-11 px-0"
                        aria-label={`Edit ${task.title}`}
                        onClick={() => {
                          setEditingTask(task);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </button>

                      {(isAdmin || task.creator._id === user._id) && (
                        <button
                          type="button"
                          className="btn btn-ghost h-11 w-11 px-0 hover:text-danger"
                          aria-label={`Delete ${task.title}`}
                          onClick={() => setDeletingTask(task)}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {!tasksLoading && tasks.length > 0 && (
            <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} />
          )}
        </div>

        <MembersPanel project={project} onChange={loadProject} onNotify={setToast} />
      </div>

      {formOpen && (
        <Modal title={editingTask ? 'Edit task' : 'New task'} onClose={() => setFormOpen(false)}>
          <TaskForm
            task={editingTask}
            people={people}
            onSubmit={saveTask}
            onClose={() => setFormOpen(false)}
          />
        </Modal>
      )}

      {deletingTask && (
        <ConfirmDialog
          title="Delete task"
          message={`"${deletingTask.title}" will be permanently deleted.`}
          onConfirm={deleteTask}
          onClose={() => setDeletingTask(null)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
