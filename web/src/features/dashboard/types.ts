// Shape of the dashboard summary payload shown on the home screen.
export interface DueSoonTask {
  id: string;
  projectId: string;
  name: string;
  dueDate: string;
  priority: string;
}

export interface DashboardSummary {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  projectsInProgress: number;
  inProgressTasks: number;
  overdueTasks: number;
  dueSoon: DueSoonTask[];
}
