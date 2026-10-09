// HTTP handlers for project CRUD endpoints — list/get/create/update/delete, all scoped to the owner.
import type { Request, Response } from 'express';
import type { CreateProjectInput, IdParam, ProjectQuery, UpdateProjectInput } from '@pms/shared';
import * as projectsService from './projects.service.js';
import { AppError } from '../../lib/errors.js';

// Reads the authenticated user's id
function ownerId(req: Request): string {
  if (!req.user) throw AppError.unauthenticated();
  return req.user.id;
}

// Lists the user's projects (filter/sort/page)
export async function listHandler(req: Request, res: Response): Promise<void> {
  const result = await projectsService.listProjects(ownerId(req), req.query as unknown as ProjectQuery);
  res.status(200).json(result);
}

// Fetches a single project by id
export async function getHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params as unknown as IdParam;
  const project = await projectsService.getProject(ownerId(req), id);
  res.status(200).json({ data: project });
}

// Creates a new project
export async function createHandler(req: Request, res: Response): Promise<void> {
  const project = await projectsService.createProject(ownerId(req), req.body as CreateProjectInput, {
    ip: req.ip,
  });
  res.status(201).json({ data: project });
}

// Updates an existing project
export async function updateHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params as unknown as IdParam;
  const project = await projectsService.updateProject(
    ownerId(req),
    id,
    req.body as UpdateProjectInput,
    { ip: req.ip },
  );
  res.status(200).json({ data: project });
}

// Deletes a project (and its tasks)
export async function deleteHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params as unknown as IdParam;
  await projectsService.deleteProject(ownerId(req), id, { ip: req.ip });
  res.status(204).send();
}
