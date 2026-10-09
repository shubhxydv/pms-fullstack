// Simple accessible loading spinner shown during async fetches.
// Renders spinning loading indicator
export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center p-8">
      <div
        className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700"
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
