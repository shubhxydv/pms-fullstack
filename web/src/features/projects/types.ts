import type { ProjectStatus } from '@pms/shared';

export interface ProjectDto {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  taskCount: number;
  completedCount: number;
}
