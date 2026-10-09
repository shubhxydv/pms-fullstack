// Single project view: task list with search/filter, inline status edits, and task CRUD.
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import type { CreateTaskInput, UpdateTaskInput } from '@pms/shared';
import * as projectsApi from '../features/projects/api';
import * as tasksApi from '../features/tasks/api';
import { TaskFormModal } from '../features/tasks/TaskFormModal';
import { Button } from '../components/Button';
import { Spinner } from '../components/Spinner';
import { ErrorRetry } from '../components/ErrorRetry';
import { EmptyState } from '../components/EmptyState';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/ToastProvider';
import { getApiErrorMessage } from '../lib/api/isApiError';
import type { TaskDto } from '../features/tasks/types';

const priorityBadge: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-700',
  MEDIUM: 'bg-amber-100 text-amber-800',
  HIGH: 'bg-red-100 text-red-700',
};

// Renders one project and its tasks
export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [formTarget, setFormTarget] = useState<TaskDto | 'new' | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TaskDto | null>(null);

  const projectQuery = useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => projectsApi.getProject(projectId!),
    enabled: Boolean(projectId),
  });

  const tasksQuery = useQuery({
    queryKey: ['tasks', projectId, { search, statusFilter, priorityFilter }],
    queryFn: () =>
      tasksApi.listTasks({
        projectId,
        q: search || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        page: 1,
        pageSize: 50,
        sort: 'dueDate',
        order: 'asc',
      }),
    enabled: Boolean(projectId),
  });

  // Refetches tasks and project data
  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    queryClient.invalidateQueries({ queryKey: ['projects'] });
  }

  const createMutation = useMutation({
    mutationFn: (input: CreateTaskInput) => tasksApi.createTask(input),
    onSuccess: () => {
      invalidateAll();
      setFormTarget(null);
      showToast('Task created', 'success');
    },
    onError: (err) => setFormError(getApiErrorMessage(err, 'Could not create task')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTaskInput }) => tasksApi.updateTask(id, input),
    onSuccess: () => {
      invalidateAll();
      setFormTarget(null);
      showToast('Task updated', 'success');
    },
    onError: (err) => setFormError(getApiErrorMessage(err, 'Could not update task')),
  });

  const quickUpdateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTaskInput }) => tasksApi.updateTask(id, input),
    onSuccess: invalidateAll,
    onError: (err) => showToast(getApiErrorMessage(err, 'Could not update task'), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tasksApi.deleteTask(id),
    onSuccess: () => {
      invalidateAll();
      setDeleteTarget(null);
      showToast('Task deleted', 'success');
    },
    onError: (err) => showToast(getApiErrorMessage(err, 'Could not delete task'), 'error'),
  });

  // Creates or updates task from form
  async function handleFormSubmit(input: CreateTaskInput | UpdateTaskInput) {
    setFormError(null);
    if (formTarget === 'new') {
      await createMutation.mutateAsync(input as CreateTaskInput);
    } else if (formTarget) {
      await updateMutation.mutateAsync({ id: formTarget.id, input });
    }
  }

  if (projectQuery.isLoading) return <Spinner label="Loading project" />;
  if (projectQuery.isError) {
    return (
      <ErrorRetry
        message={getApiErrorMessage(projectQuery.error, 'Could not load this project.')}
        onRetry={() => projectQuery.refetch()}
      />
    );
  }
  const project = projectQuery.data;
  if (!project) return null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to="/projects" className="text-sm text-slate-500 hover:underline">
          ← Back to projects
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-slate-900">{project.name}</h1>
        {project.description && <p className="mt-1 text-sm text-slate-600">{project.description}</p>}
        <p className="mt-1 text-xs text-slate-500">
          {project.startDate} → {project.endDate} · {project.status.replace('_', ' ')}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Tasks</h2>
        <Button onClick={() => setFormTarget('new')}>New task</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          type="search"
          placeholder="Search tasks…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[160px] flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm"
        >
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm"
        >
          <option value="">All priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>
      </div>

      {tasksQuery.isLoading && <Spinner label="Loading tasks" />}
      {tasksQuery.isError && (
        <ErrorRetry
          message={getApiErrorMessage(tasksQuery.error, 'Could not load tasks.')}
          onRetry={() => tasksQuery.refetch()}
        />
      )}
      {!tasksQuery.isLoading && !tasksQuery.isError && tasksQuery.data?.data.length === 0 && (
        <EmptyState message="No tasks match your filters." />
      )}

      {!tasksQuery.isLoading && !tasksQuery.isError && tasksQuery.data && tasksQuery.data.data.length > 0 && (
        <ul className="flex flex-col gap-2">
          {tasksQuery.data.data.map((task) => (
            <li
              key={task.id}
              className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={task.status === 'COMPLETED'}
                  aria-label={`Mark "${task.name}" complete`}
                  onChange={(e) =>
                    quickUpdateMutation.mutate({
                      id: task.id,
                      input: { status: e.target.checked ? 'COMPLETED' : 'PENDING' },
                    })
                  }
                  className="mt-1 h-4 w-4"
                />
                <div>
                  <p
                    className={`font-medium ${task.status === 'COMPLETED' ? 'text-slate-400 line-through' : 'text-slate-900'}`}
                  >
                    {task.name}
                  </p>
                  <p className="text-xs text-slate-500">Due {task.dueDate}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityBadge[task.priority]}`}>
                  {task.priority}
                </span>
                <select
                  value={task.status}
                  aria-label={`Status for ${task.name}`}
                  onChange={(e) =>
                    quickUpdateMutation.mutate({
                      id: task.id,
                      input: { status: e.target.value as TaskDto['status'] },
                    })
                  }
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                >
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
                <Button variant="secondary" onClick={() => setFormTarget(task)}>
                  Edit
                </Button>
                <Button variant="danger" onClick={() => setDeleteTarget(task)}>
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {formTarget && projectId && (
        <TaskFormModal
          projectId={projectId}
          task={formTarget === 'new' ? undefined : formTarget}
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
          title="Delete task"
          message={`Delete "${deleteTarget.name}"? This cannot be undone.`}
          isLoading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
