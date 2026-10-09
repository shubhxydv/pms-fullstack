// Projects list page: search/filter/sort, pagination, and project CRUD.
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import type { CreateProjectInput, UpdateProjectInput } from '@pms/shared';
import * as projectsApi from '../features/projects/api';
import { ProjectFormModal } from '../features/projects/ProjectFormModal';
import { Button } from '../components/Button';
import { Spinner } from '../components/Spinner';
import { ErrorRetry } from '../components/ErrorRetry';
import { EmptyState } from '../components/EmptyState';
import { ProgressBar } from '../components/ProgressBar';
import { Pagination } from '../components/Pagination';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/ToastProvider';
import { getApiErrorMessage } from '../lib/api/isApiError';
import type { ProjectDto } from '../features/projects/types';

const statusBadge: Record<string, string> = {
  NOT_STARTED: 'bg-slate-100 text-slate-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
};

// Renders project list with filters
export function ProjectsPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState('');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [formTarget, setFormTarget] = useState<ProjectDto | 'new' | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectDto | null>(null);

  // Debounces search input before querying
  useEffect(() => {
    const timeout = setTimeout(() => {
      setQ(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['projects', { q, status, sort, order, page, pageSize }],
    queryFn: () =>
      projectsApi.listProjects({
        q: q || undefined,
        status: status || undefined,
        sort,
        order,
        page,
        pageSize,
      }),
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateProjectInput) => projectsApi.createProject(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setFormTarget(null);
      showToast('Project created', 'success');
    },
    onError: (err) => setFormError(getApiErrorMessage(err, 'Could not create project')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProjectInput }) =>
      projectsApi.updateProject(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setFormTarget(null);
      showToast('Project updated', 'success');
    },
    onError: (err) => setFormError(getApiErrorMessage(err, 'Could not update project')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectsApi.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setDeleteTarget(null);
      showToast('Project deleted', 'success');
    },
    onError: (err) => showToast(getApiErrorMessage(err, 'Could not delete project'), 'error'),
  });

  // Creates or updates project from form
  async function handleFormSubmit(input: CreateProjectInput | UpdateProjectInput) {
    setFormError(null);
    if (formTarget === 'new') {
      await createMutation.mutateAsync(input as CreateProjectInput);
    } else if (formTarget) {
      await updateMutation.mutateAsync({ id: formTarget.id, input });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900">Projects</h1>
        <Button onClick={() => setFormTarget('new')}>New project</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          type="search"
          placeholder="Search projects…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="min-w-[180px] flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm"
        >
          <option value="">All statuses</option>
          <option value="NOT_STARTED">Not started</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <select
          value={`${sort}:${order}`}
          onChange={(e) => {
            const [nextSort, nextOrder] = e.target.value.split(':') as [string, 'asc' | 'desc'];
            setSort(nextSort);
            setOrder(nextOrder);
          }}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm"
        >
          <option value="createdAt:desc">Newest first</option>
          <option value="createdAt:asc">Oldest first</option>
          <option value="name:asc">Name A-Z</option>
          <option value="name:desc">Name Z-A</option>
          <option value="endDate:asc">Due date</option>
        </select>
      </div>

      {isLoading && <Spinner label="Loading projects" />}
      {isError && (
        <ErrorRetry message={getApiErrorMessage(error, 'Could not load projects.')} onRetry={() => refetch()} />
      )}
      {!isLoading && !isError && data && data.data.length === 0 && (
        <EmptyState message="No projects yet. Create your first one." />
      )}

      {!isLoading && !isError && data && data.data.length > 0 && (
        <ul className="flex flex-col gap-3">
          {data.data.map((project) => (
            <li
              key={project.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col gap-1">
                <Link to={`/projects/${project.id}`} className="font-medium text-slate-900 hover:underline">
                  {project.name}
                </Link>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge[project.status] ?? ''}`}
                  >
                    {project.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-slate-500">
                    {project.startDate} → {project.endDate}
                  </span>
                  <ProgressBar completed={project.completedCount} total={project.taskCount} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setFormTarget(project)}>
                  Edit
                </Button>
                <Button variant="danger" onClick={() => setDeleteTarget(project)}>
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {data && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onPageChange={setPage} />}

      {formTarget && (
        <ProjectFormModal
          project={formTarget === 'new' ? undefined : formTarget}
          onClose={() => {
            setFormTarget(null);
            setFormError(null);
          }}
          onSubmit={handleFormSubmit}
          submitError={formError}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete project"
          message={`Delete "${deleteTarget.name}"? This will also delete all of its tasks. This cannot be undone.`}
          isLoading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
