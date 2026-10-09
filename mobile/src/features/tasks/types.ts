// Shape of a task as returned by the API.
import type { TaskPriority, TaskStatus } from '@pms/shared';

export interface TaskDto {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}
