// CRUD API calls for tasks.
import type { CreateTaskInput, ListResponse, UpdateTaskInput } from '@pms/shared';
import { apiClient } from '../../lib/api/client';
import type { TaskDto } from './types';

export interface TaskQueryParams {
  projectId?: string;
  q?: string;
  status?: string;
  priority?: string;
  page: number;
  pageSize: number;
  sort: string;
  order: 'asc' | 'desc';
}

// Fetches filtered, paginated tasks
export async function listTasks(params: TaskQueryParams): Promise<ListResponse<TaskDto>> {
  const res = await apiClient.get<ListResponse<TaskDto>>('/tasks', { params });
  return res.data;
}

// Creates a new task
export async function createTask(input: CreateTaskInput): Promise<TaskDto> {
  const res = await apiClient.post<{ data: TaskDto }>('/tasks', input);
  return res.data.data;
}

// Updates an existing task
export async function updateTask(id: string, input: UpdateTaskInput): Promise<TaskDto> {
  const res = await apiClient.put<{ data: TaskDto }>(`/tasks/${id}`, input);
  return res.data.data;
}

// Deletes a task by id
export async function deleteTask(id: string): Promise<void> {
  await apiClient.delete(`/tasks/${id}`);
}
