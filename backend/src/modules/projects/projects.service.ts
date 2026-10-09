// Project business logic: ownership-scoped CRUD, search/filter/sort/pagination, and audit logging.
import type { CreateProjectInput, ProjectQuery, UpdateProjectInput, ListResponse } from '@pms/shared';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../lib/errors.js';
import { toPageArgs, toPaginationMeta } from '../../lib/pagination.js';
import { recordAudit } from '../../lib/audit.js';

export interface AuditMeta {
  ip?: string | null;
}

export interface ProjectDto {
  id: string;
  name: string;
  description: string | null;
  status: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  taskCount: number;
  completedCount: number;
}

// Formats a Date as YYYY-MM-DD
function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Throws 404 unless the project belongs to this owner
async function assertOwned(ownerId: string, projectId: string) {
  const project = await prisma.project.findFirst({ where: { id: projectId, ownerId } });
  if (!project) {
    throw AppError.notFound('Project not found');
  }
  return project;
}

// Lists projects with search, filter, sort, paging
export async function listProjects(ownerId: string, query: ProjectQuery): Promise<ListResponse<ProjectDto>> {
  const where: Prisma.ProjectWhereInput = {
    ownerId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: 'insensitive' } },
            { description: { contains: query.q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: { [query.sort]: query.order },
      ...toPageArgs(query.page, query.pageSize),
      include: { _count: { select: { tasks: true } } },
    }),
    prisma.project.count({ where }),
  ]);

  const projectIds = projects.map((p) => p.id);
  const completedCounts = projectIds.length
    ? await prisma.task.groupBy({
        by: ['projectId'],
        where: { projectId: { in: projectIds }, status: 'COMPLETED' },
        _count: { _all: true },
      })
    : [];
  const completedByProject = new Map(completedCounts.map((c) => [c.projectId, c._count._all]));

  const data: ProjectDto[] = projects.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    status: p.status,
    startDate: toDateOnly(p.startDate),
    endDate: toDateOnly(p.endDate),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    taskCount: p._count.tasks,
    completedCount: completedByProject.get(p.id) ?? 0,
  }));

  return { data, meta: toPaginationMeta(query.page, query.pageSize, total) };
}

// Fetches one project with task counts
export async function getProject(ownerId: string, projectId: string): Promise<ProjectDto> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId },
    include: { _count: { select: { tasks: true } } },
  });
  if (!project) {
    throw AppError.notFound('Project not found');
  }
  const completed = await prisma.task.count({
    where: { projectId, status: 'COMPLETED' },
  });
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status,
    startDate: toDateOnly(project.startDate),
    endDate: toDateOnly(project.endDate),
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    taskCount: project._count.tasks,
    completedCount: completed,
  };
}

// Creates a project and records the audit entry
export async function createProject(
  ownerId: string,
  input: CreateProjectInput,
  meta: AuditMeta = {},
): Promise<ProjectDto> {
  const project = await prisma.project.create({
    data: {
      ownerId,
      name: input.name,
      description: input.description,
      status: input.status,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
    },
  });
  await recordAudit({
    userId: ownerId,
    action: 'PROJECT_CREATED',
    entityType: 'Project',
    entityId: project.id,
    ip: meta.ip,
  });
  return getProject(ownerId, project.id);
}

// Updates a project after validating date range
export async function updateProject(
  ownerId: string,
  projectId: string,
  input: UpdateProjectInput,
  meta: AuditMeta = {},
): Promise<ProjectDto> {
  const existing = await assertOwned(ownerId, projectId);

  const nextStart = input.startDate ? new Date(input.startDate) : existing.startDate;
  const nextEnd = input.endDate ? new Date(input.endDate) : existing.endDate;
  if (nextEnd < nextStart) {
    throw AppError.validation('End date must be on or after start date', [
      { path: 'endDate', message: 'End date must be on or after start date' },
    ]);
  }

  await prisma.project.update({
    where: { id: projectId },
    data: {
      name: input.name,
      description: input.description,
      status: input.status,
      startDate: input.startDate ? nextStart : undefined,
      endDate: input.endDate ? nextEnd : undefined,
    },
  });
  await recordAudit({
    userId: ownerId,
    action: 'PROJECT_UPDATED',
    entityType: 'Project',
    entityId: projectId,
    metadata: input,
    ip: meta.ip,
  });

  return getProject(ownerId, projectId);
}

// Deletes a project after checking ownership
export async function deleteProject(
  ownerId: string,
  projectId: string,
  meta: AuditMeta = {},
): Promise<void> {
  await assertOwned(ownerId, projectId);
  await prisma.project.delete({ where: { id: projectId } });
  await recordAudit({
    userId: ownerId,
    action: 'PROJECT_DELETED',
    entityType: 'Project',
    entityId: projectId,
    ip: meta.ip,
  });
}
