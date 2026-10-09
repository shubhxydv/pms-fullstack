// Home page: summary stat cards plus a due-soon task list.
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchDashboard } from '../features/dashboard/api';
import { StatCard } from '../components/StatCard';
import { Spinner } from '../components/Spinner';
import { ErrorRetry } from '../components/ErrorRetry';
import { EmptyState } from '../components/EmptyState';
import { getApiErrorMessage } from '../lib/api/isApiError';

const priorityBadge: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-700',
  MEDIUM: 'bg-amber-100 text-amber-800',
  HIGH: 'bg-red-100 text-red-700',
};

// Renders dashboard stats and due-soon list
export function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
  });

  if (isLoading) return <Spinner label="Loading dashboard" />;
  if (isError) {
    return (
      <ErrorRetry
        message={getApiErrorMessage(error, 'Could not load the dashboard.')}
        onRetry={() => refetch()}
      />
    );
  }
  if (!data) return null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total projects" value={data.totalProjects} />
        <StatCard label="Total tasks" value={data.totalTasks} />
        <StatCard label="Completed" value={data.completedTasks} />
        <StatCard label="Pending" value={data.pendingTasks} />
        <StatCard label="Projects in progress" value={data.projectsInProgress} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">Overdue tasks</p>
          <p className="mt-1 text-2xl font-semibold text-red-700">{data.overdueTasks}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-medium text-slate-500">Tasks in progress</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{data.inProgressTasks}</p>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Due soon</h2>
        {data.dueSoon.length === 0 ? (
          <EmptyState message="No upcoming tasks due." />
        ) : (
          <ul className="flex flex-col gap-2">
            {data.dueSoon.map((task) => (
              <li key={task.id}>
                <Link
                  to={`/projects/${task.projectId}`}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 hover:bg-slate-50"
                >
                  <span className="text-sm font-medium text-slate-900">{task.name}</span>
                  <span className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityBadge[task.priority] ?? ''}`}
                    >
                      {task.priority}
                    </span>
                    <span className="text-xs text-slate-500">{task.dueDate}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
