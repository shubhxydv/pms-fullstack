// Admin-only page: paginated table of audit log entries.
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as adminApi from '../features/admin/api';
import { Spinner } from '../components/Spinner';
import { ErrorRetry } from '../components/ErrorRetry';
import { EmptyState } from '../components/EmptyState';
import { Pagination } from '../components/Pagination';
import { getApiErrorMessage } from '../lib/api/isApiError';

// Renders paginated audit log table
export function AdminPage() {
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'audit-logs', page],
    queryFn: () => adminApi.listAuditLogs(page, pageSize),
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-slate-900">Audit logs</h1>

      {isLoading && <Spinner label="Loading audit logs" />}
      {isError && (
        <ErrorRetry message={getApiErrorMessage(error, 'Could not load audit logs.')} onRetry={() => refetch()} />
      )}
      {!isLoading && !isError && data && data.data.length === 0 && (
        <EmptyState message="No audit log entries yet." />
      )}

      {!isLoading && !isError && data && data.data.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">When</th>
                <th className="px-4 py-2">User</th>
                <th className="px-4 py-2">Action</th>
                <th className="px-4 py-2">Entity</th>
                <th className="px-4 py-2">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.data.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-2 text-slate-600">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-2 text-slate-900">{log.userEmail ?? '—'}</td>
                  <td className="px-4 py-2 font-medium text-slate-900">{log.action}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {log.entityType}
                    {log.entityId ? ` #${log.entityId.slice(0, 8)}` : ''}
                  </td>
                  <td className="px-4 py-2 text-slate-500">{log.ip ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onPageChange={setPage} />}
    </div>
  );
}
