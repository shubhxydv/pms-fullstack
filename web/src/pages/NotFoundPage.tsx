// Fallback 404 page for unmatched routes.
import { Link } from 'react-router-dom';

// Renders 404 not-found message
export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">Page not found</h1>
      <p className="text-slate-600">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link to="/dashboard" className="text-sm font-medium text-slate-900 underline">
        Back to dashboard
      </Link>
    </div>
  );
}
