// Task business logic: ownership-scoped CRUD (via the parent project's owner), search/filter/sort, and audit logging.
import type { CreateTaskInput, ListResponse, TaskQuery, UpdateTaskInput } from '@pms/shared';
import type { Prisma, Task } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { toPageArgs, toPaginationMeta } from '../../lib/pagination.js';
import { recordAudit } from '../../lib/audit.js';

export interface AuditMeta {
  ip?: string | null;
}

export interface TaskDto {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  priority: string;
  status: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

// Formats a Date as YYYY-MM-DD
function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Maps a Prisma Task to the client-facing DTO
function toTaskDto(task: Task): TaskDto {
  return {
    id: task.id,
    projectId: task.projectId,
    name: task.name,
    description: task.description,
    priority: task.priority,
    status: task.status,
    dueDate: toDateOnly(task.dueDate),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

// Throws 404 unless the task's project belongs to this owner
async function findOwnedTask(ownerId: string, taskId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, project: { ownerId } },
  });
  if (!task) {
    throw AppError.notFound('Task not found');
  }
  return task;
}

// Lists tasks with search, filter, sort, paging
export async function listTasks(ownerId: string, query: TaskQuery): Promise<ListResponse<TaskDto>> {
  const where: Prisma.TaskWhereInput = {
    project: { ownerId },
    ...(query.projectId ? { projectId: query.projectId } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.priority ? { priority: query.priority } : {}),
    ...(query.dueBefore ? { dueDate: { lt: new Date(query.dueBefore) } } : {}),
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: 'insensitive' } },
            { description: { contains: query.q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy: { [query.sort]: query.order },
      ...toPageArgs(query.page, query.pageSize),
    }),
    prisma.task.count({ where }),
  ]);

  return {
    data: tasks.map(toTaskDto),
    meta: toPaginationMeta(query.page, query.pageSize, total),
  };
}

// Fetches one task, checking ownership
export async function getTask(ownerId: string, taskId: string): Promise<TaskDto> {
  const task = await findOwnedTask(ownerId, taskId);
  return toTaskDto(task);
}

// Creates a task under an owned project
export async function createTask(
  ownerId: string,
  input: CreateTaskInput,
  meta: AuditMeta = {},
): Promise<TaskDto> {
  const project = await prisma.project.findFirst({
    where: { id: input.projectId, ownerId },
  });
  if (!project) {
    throw AppError.notFound('Project not found');
  }

  const task = await prisma.task.create({
    data: {
      projectId: input.projectId,
      name: input.name,
      description: input.description,
      priority: input.priority,
      status: input.status,
      dueDate: new Date(input.dueDate),
    },
  });
  await recordAudit({
    userId: ownerId,
    action: 'TASK_CREATED',
    entityType: 'Task',
    entityId: task.id,
    ip: meta.ip,
  });
  return toTaskDto(task);
}

// Updates a task after checking ownership
export async function updateTask(
  ownerId: string,
  taskId: string,
  input: UpdateTaskInput,
  meta: AuditMeta = {},
): Promise<TaskDto> {
  await findOwnedTask(ownerId, taskId);

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      name: input.name,
      description: input.description,
      priority: input.priority,
      status: input.status,
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
    },
  });
  await recordAudit({
    userId: ownerId,
    action: 'TASK_UPDATED',
    entityType: 'Task',
    entityId: taskId,
    metadata: input,
    ip: meta.ip,
  });
  return toTaskDto(task);
}

// Deletes a task after checking ownership
export async function deleteTask(
  ownerId: string,
  taskId: string,
  meta: AuditMeta = {},
): Promise<void> {
  await findOwnedTask(ownerId, taskId);
  await prisma.task.delete({ where: { id: taskId } });
  await recordAudit({
    userId: ownerId,
    action: 'TASK_DELETED',
    entityType: 'Task',
    entityId: taskId,
    ip: meta.ip,
  });
}
