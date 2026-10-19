import { ReactNode } from "react";
import { AlertTriangle, Inbox } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ title = "Unable to load this content.", message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/5 bg-ink-800 px-6 py-16 text-center">
      <AlertTriangle className="h-8 w-8 text-marquee" />
      <p className="font-display text-lg font-semibold text-white">{title}</p>
      {message && <p className="max-w-sm text-sm text-mist">{message}</p>}
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary mt-2">
          Try Again
        </button>
      )}
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  message?: string;
  action?: ReactNode;
}

export function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center">
      <Inbox className="h-8 w-8 text-mist" />
      <p className="font-display text-lg font-semibold text-white">{title}</p>
      {message && <p className="max-w-sm text-sm text-mist">{message}</p>}
      {action}
    </div>
  );
}
