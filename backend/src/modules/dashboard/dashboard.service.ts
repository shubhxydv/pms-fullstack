// Builds the dashboard summary: project/task counts, overdue tasks, and tasks due soon.
import { prisma } from '../../lib/prisma.js';
import { todayDateString, dateOnlyToUtcMidnight } from '../../lib/date.js';

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

// Aggregates counts and due-soon tasks
export async function getDashboard(ownerId: string): Promise<DashboardSummary> {
  const today = dateOnlyToUtcMidnight(todayDateString());

  const [totalProjects, projectsInProgress, statusCounts, overdueTasks, dueSoonRaw] =
    await Promise.all([
      prisma.project.count({ where: { ownerId } }),
      prisma.project.count({ where: { ownerId, status: 'IN_PROGRESS' } }),
      prisma.task.groupBy({
        by: ['status'],
        where: { project: { ownerId } },
        _count: { _all: true },
      }),
      prisma.task.count({
        where: { project: { ownerId }, status: { not: 'COMPLETED' }, dueDate: { lt: today } },
      }),
      prisma.task.findMany({
        where: { project: { ownerId }, status: { not: 'COMPLETED' }, dueDate: { gte: today } },
        orderBy: { dueDate: 'asc' },
        take: 5,
        select: { id: true, projectId: true, name: true, dueDate: true, priority: true },
      }),
    ]);

  const countByStatus = new Map(statusCounts.map((s) => [s.status, s._count._all]));
  const completedTasks = countByStatus.get('COMPLETED') ?? 0;
  const pendingTasks = countByStatus.get('PENDING') ?? 0;
  const inProgressTasks = countByStatus.get('IN_PROGRESS') ?? 0;
  const totalTasks = completedTasks + pendingTasks + inProgressTasks;

  return {
    totalProjects,
    totalTasks,
    completedTasks,
    pendingTasks,
    projectsInProgress,
    inProgressTasks,
    overdueTasks,
    dueSoon: dueSoonRaw.map((t) => ({
      id: t.id,
      projectId: t.projectId,
      name: t.name,
      dueDate: t.dueDate.toISOString().slice(0, 10),
      priority: t.priority,
    })),
  };
}
