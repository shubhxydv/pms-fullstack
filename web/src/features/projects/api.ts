// CRUD API calls for projects.
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

// Fetches filtered, paginated projects
export async function listProjects(params: ProjectQueryParams): Promise<ListResponse<ProjectDto>> {
  const res = await apiClient.get<ListResponse<ProjectDto>>('/projects', { params });
  return res.data;
}

// Fetches a single project
export async function getProject(id: string): Promise<ProjectDto> {
  const res = await apiClient.get<{ data: ProjectDto }>(`/projects/${id}`);
  return res.data.data;
}

// Creates a new project
export async function createProject(input: CreateProjectInput): Promise<ProjectDto> {
  const res = await apiClient.post<{ data: ProjectDto }>('/projects', input);
  return res.data.data;
}

// Updates an existing project
export async function updateProject(id: string, input: UpdateProjectInput): Promise<ProjectDto> {
  const res = await apiClient.put<{ data: ProjectDto }>(`/projects/${id}`, input);
  return res.data.data;
}

// Deletes a project by id
export async function deleteProject(id: string): Promise<void> {
  await apiClient.delete(`/projects/${id}`);
}
