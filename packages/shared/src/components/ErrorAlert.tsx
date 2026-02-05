/**
 * ErrorAlert Component
 *
 * Displays error messages in a consistent, accessible format
 */

interface ErrorAlertProps {
  error: string | null;
  className?: string;
  onDismiss?: () => void;
}

export function ErrorAlert({ error, className = '', onDismiss }: ErrorAlertProps) {
  if (!error) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`text-red-400 text-sm ${className}`}
    >
      <span>{error}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-2 text-red-300 hover:text-red-200"
          aria-label="Dismiss error"
        >
          <span aria-hidden="true">&times;</span>
        </button>
      )}
    </div>
  );
}
