import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CircleAlert, CircleCheck, Clock, FolderKanban, ListTodo, RotateCw } from 'lucide-react';
import api, { getErrorMessage } from '../api';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/EmptyState';
import { formatDate, isOverdue, priorityStyles, statusStyles } from '../taskMeta';

export default function Dashboard() {
  const { user } = useAuth();
  const [projectCount, setProjectCount] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [projectsRes, tasksRes] = await Promise.all([
        api.get('/projects', { params: { limit: 1 } }),
        api.get('/tasks', { params: { limit: 100, sort: 'dueDate' } }),
      ]);
      setProjectCount(projectsRes.data.total);
      setTasks(tasksRes.data.items);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const myTasks = tasks.filter((task) => task.assignee?._id === user._id);
  const stats = [
    { label: 'Projects', value: projectCount, icon: FolderKanban },
    { label: 'To do', value: myTasks.filter((task) => task.status === 'Todo').length, icon: ListTodo },
    { label: 'In progress', value: myTasks.filter((task) => task.status === 'In Progress').length, icon: Clock },
    { label: 'Done', value: myTasks.filter((task) => task.status === 'Done').length, icon: CircleCheck },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-24 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-slate-200" />
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="card flex flex-col items-center gap-3 text-center">
        <CircleAlert className="h-8 w-8 text-danger" aria-hidden="true" />
        <p className="text-sm text-muted">{error}</p>
        <button type="button" className="btn btn-secondary" onClick={load}>
          <RotateCw className="h-4 w-4" aria-hidden="true" />
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Hi {user.name.split(' ')[0]}</h1>
        <p className="mt-1 text-sm text-muted">Here is what is on your plate right now.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card flex items-center gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-soft">
              <stat.icon className="h-5 w-5 text-primary" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm text-muted">{stat.label}</p>
              <p className="text-2xl font-semibold tabular-nums">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">My tasks</h2>
          <Link to="/projects" className="text-sm font-medium text-primary hover:underline">
            View all projects
          </Link>
        </div>

        {myTasks.length === 0 ? (
          <EmptyState
            icon={ListTodo}
            title="No tasks assigned to you"
            description="Once someone assigns you a task it will show up here."
            action={
              <Link to="/projects" className="btn btn-primary">
                Browse projects
              </Link>
            }
          />
        ) : (
          <ul className="space-y-3">
            {myTasks.slice(0, 6).map((task) => (
              <li key={task._id}>
                <Link
                  to={`/projects/${task.project._id}`}
                  className="card flex flex-col gap-3 transition-shadow duration-200 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="mt-1 text-sm text-muted">{task.project.name}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`badge ${statusStyles[task.status]}`}>{task.status}</span>
                    <span className={`badge ${priorityStyles[task.priority]}`}>{task.priority}</span>
                    <span className={`text-sm ${isOverdue(task) ? 'font-medium text-danger' : 'text-muted'}`}>
                      {formatDate(task.dueDate)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
