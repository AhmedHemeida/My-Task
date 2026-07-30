import { useEffect } from 'react';
import { CircleAlert, CircleCheck, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  const isError = type === 'error';
  const Icon = isError ? CircleAlert : CircleCheck;

  return (
    <div
      role="status"
      aria-live="polite"
      className="toast-panel fixed bottom-4 left-4 right-4 z-50 flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 shadow-lg sm:left-auto sm:w-96"
    >
      <Icon
        className={`h-5 w-5 shrink-0 ${isError ? 'text-danger' : 'text-success'}`}
        aria-hidden="true"
      />
      <p className="flex-1 text-sm">{message}</p>
      <button type="button" onClick={onClose} aria-label="Dismiss notification" className="btn btn-ghost h-9 w-9 px-0">
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
