// Visual bar showing completed-vs-total progress.
// Renders percentage bar from counts
export function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return (
    <div className="flex items-center gap-2">
      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 w-24 overflow-hidden rounded-full bg-slate-200"
      >
        <div className="h-full bg-emerald-500" style={{ width: `${percent}%` }} />
      </div>
      <span className="text-xs text-slate-500">
        {completed}/{total}
      </span>
    </div>
  );
}
