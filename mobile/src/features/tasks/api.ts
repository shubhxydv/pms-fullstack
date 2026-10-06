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

export async function listTasks(params: TaskQueryParams): Promise<ListResponse<TaskDto>> {
  const res = await apiClient.get<ListResponse<TaskDto>>('/tasks', { params });
  return res.data;
}

export async function getTask(id: string): Promise<TaskDto> {
  const res = await apiClient.get<{ data: TaskDto }>(`/tasks/${id}`);
  return res.data.data;
}

export async function createTask(input: CreateTaskInput): Promise<TaskDto> {
  const res = await apiClient.post<{ data: TaskDto }>('/tasks', input);
  return res.data.data;
}

export async function updateTask(id: string, input: UpdateTaskInput): Promise<TaskDto> {
  const res = await apiClient.put<{ data: TaskDto }>(`/tasks/${id}`, input);
  return res.data.data;
}

export async function deleteTask(id: string): Promise<void> {
  await apiClient.delete(`/tasks/${id}`);
}
