import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { CircleAlert, Eye, EyeOff, ListChecks, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (user) return <Navigate to="/" replace />;

  function update(field, value) {
    setForm({ ...form, [field]: value });
    setErrors({ ...errors, [field]: '' });
  }

  function validate() {
    const found = {};
    if (!form.email.trim()) found.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) found.email = 'Enter a valid email address';
    if (!form.password) found.password = 'Password is required';
    return found;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setServerError('');
    setSubmitting(true);
    try {
      await login(form.email.trim(), form.password);
      navigate('/');
    } catch (error) {
      setServerError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <ListChecks className="h-9 w-9 text-primary" aria-hidden="true" />
          <h1 className="mt-3 text-2xl font-semibold">Welcome back</h1>
          <p className="mt-1 text-sm text-muted">Log in to manage your projects and tasks.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="card space-y-4">
          {serverError && (
            <div role="alert" className="flex items-start gap-2 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {serverError}
            </div>
          )}

          <div>
            <label htmlFor="email" className="label">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className={`field ${errors.email ? 'field-error' : ''}`}
              placeholder="you@example.com"
              value={form.email}
              onChange={(event) => update('email', event.target.value)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <p id="email-error" className="mt-1 text-sm text-danger">
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="label">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className={`field pr-12 ${errors.password ? 'field-error' : ''}`}
                placeholder="Your password"
                value={form.password}
                onChange={(event) => update('password', event.target.value)}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'password-error' : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="btn btn-ghost absolute right-0 top-0 h-11 w-11 px-0"
              >
                {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
            {errors.password && (
              <p id="password-error" className="mt-1 text-sm text-danger">
                {errors.password}
              </p>
            )}
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {submitting ? 'Logging in...' : 'Log in'}
          </button>

          <p className="text-center text-sm text-muted">
            No account yet?{' '}
            <Link to="/register" className="font-medium text-primary hover:underline">
              Create one
            </Link>
          </p>
        </form>

        <div className="mt-4 rounded-lg border border-line bg-surface px-4 py-3 text-sm text-muted">
          <p className="font-medium text-ink">Demo accounts</p>
          <p className="mt-1">Admin: admin@taskmanager.com / Admin123</p>
          <p>Member: sara@taskmanager.com / Member123</p>
        </div>
      </div>
    </div>
  );
}
