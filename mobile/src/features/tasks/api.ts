import type { CreateTaskInput, ListResponse, UpdateTaskInput } from '@pms/shared';
import { apiClient } from '../../lib/api/client';
import type { TaskDto } from './types';

// CRUD API calls for tasks.
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

// Fetches a filtered, paged task list
export async function listTasks(params: TaskQueryParams): Promise<ListResponse<TaskDto>> {
  const res = await apiClient.get<ListResponse<TaskDto>>('/tasks', { params });
  return res.data;
}

// Fetches one task by id
export async function getTask(id: string): Promise<TaskDto> {
  const res = await apiClient.get<{ data: TaskDto }>(`/tasks/${id}`);
  return res.data.data;
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
