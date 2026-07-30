import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { CircleAlert, Eye, EyeOff, ListChecks, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api';

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
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
    if (!form.name.trim()) found.name = 'Name is required';
    if (!form.email.trim()) found.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) found.email = 'Enter a valid email address';
    if (form.password.length < 6) found.password = 'Password must be at least 6 characters';
    if (form.confirmPassword !== form.password) found.confirmPassword = 'Passwords do not match';
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
      await register(form.name.trim(), form.email.trim(), form.password);
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
          <h1 className="mt-3 text-2xl font-semibold">Create your account</h1>
          <p className="mt-1 text-sm text-muted">New accounts join as members.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="card space-y-4">
          {serverError && (
            <div role="alert" className="flex items-start gap-2 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {serverError}
            </div>
          )}

          <div>
            <label htmlFor="name" className="label">
              Full name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              className={`field ${errors.name ? 'field-error' : ''}`}
              placeholder="Sara Ali"
              value={form.name}
              onChange={(event) => update('name', event.target.value)}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && (
              <p id="name-error" className="mt-1 text-sm text-danger">
                {errors.name}
              </p>
            )}
          </div>

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
                autoComplete="new-password"
                className={`field pr-12 ${errors.password ? 'field-error' : ''}`}
                placeholder="At least 6 characters"
                value={form.password}
                onChange={(event) => update('password', event.target.value)}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'password-error' : 'password-hint'}
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
            {errors.password ? (
              <p id="password-error" className="mt-1 text-sm text-danger">
                {errors.password}
              </p>
            ) : (
              <p id="password-hint" className="mt-1 text-sm text-muted">
                Use at least 6 characters.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="label">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className={`field ${errors.confirmPassword ? 'field-error' : ''}`}
              placeholder="Repeat your password"
              value={form.confirmPassword}
              onChange={(event) => update('confirmPassword', event.target.value)}
              aria-invalid={Boolean(errors.confirmPassword)}
              aria-describedby={errors.confirmPassword ? 'confirm-error' : undefined}
            />
            {errors.confirmPassword && (
              <p id="confirm-error" className="mt-1 text-sm text-danger">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {submitting ? 'Creating account...' : 'Create account'}
          </button>

          <p className="text-center text-sm text-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
