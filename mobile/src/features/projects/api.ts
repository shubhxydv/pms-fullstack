import type { CreateProjectInput, ListResponse, UpdateProjectInput } from '@pms/shared';
import { apiClient } from '../../lib/api/client';
import type { ProjectDto } from './types';

export interface ProjectQueryParams {
  q?: string;
  status?: string;
  page: number;
  pageSize: number;
  sort: string;
  order: 'asc' | 'desc';
}

export async function listProjects(params: ProjectQueryParams): Promise<ListResponse<ProjectDto>> {
  const res = await apiClient.get<ListResponse<ProjectDto>>('/projects', { params });
  return res.data;
}

export async function getProject(id: string): Promise<ProjectDto> {
  const res = await apiClient.get<{ data: ProjectDto }>(`/projects/${id}`);
  return res.data.data;
}

export async function createProject(input: CreateProjectInput): Promise<ProjectDto> {
  const res = await apiClient.post<{ data: ProjectDto }>('/projects', input);
  return res.data.data;
}

export async function updateProject(id: string, input: UpdateProjectInput): Promise<ProjectDto> {
  const res = await apiClient.put<{ data: ProjectDto }>(`/projects/${id}`, input);
  return res.data.data;
}

export async function deleteProject(id: string): Promise<void> {
  await apiClient.delete(`/projects/${id}`);
}
