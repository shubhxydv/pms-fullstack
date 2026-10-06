import type { Request, Response } from 'express';
import type { CreateProjectInput, IdParam, ProjectQuery, UpdateProjectInput } from '@pms/shared';
import * as projectsService from './projects.service.js';
import { AppError } from '../../lib/errors.js';

function ownerId(req: Request): string {
  if (!req.user) throw AppError.unauthenticated();
  return req.user.id;
}

export async function listHandler(req: Request, res: Response): Promise<void> {
  const result = await projectsService.listProjects(ownerId(req), req.query as unknown as ProjectQuery);
  res.status(200).json(result);
}

export async function getHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params as unknown as IdParam;
  const project = await projectsService.getProject(ownerId(req), id);
  res.status(200).json({ data: project });
}

export async function createHandler(req: Request, res: Response): Promise<void> {
  const project = await projectsService.createProject(ownerId(req), req.body as CreateProjectInput, {
    ip: req.ip,
  });
  res.status(201).json({ data: project });
}

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

export async function deleteHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params as unknown as IdParam;
  await projectsService.deleteProject(ownerId(req), id, { ip: req.ip });
  res.status(204).send();
}
