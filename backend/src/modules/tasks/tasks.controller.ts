// HTTP handlers for task CRUD endpoints — list/get/create/update/delete, all scoped to the owner's projects.
import type { Request, Response } from 'express';
import type { CreateTaskInput, IdParam, TaskQuery, UpdateTaskInput } from '@pms/shared';
import * as tasksService from './tasks.service.js';
import { AppError } from '../../lib/errors.js';

// Reads the authenticated user's id
function ownerId(req: Request): string {
  if (!req.user) throw AppError.unauthenticated();
  return req.user.id;
}

// Lists the user's tasks (filter/sort/page)
export async function listHandler(req: Request, res: Response): Promise<void> {
  const result = await tasksService.listTasks(ownerId(req), req.query as unknown as TaskQuery);
  res.status(200).json(result);
}

// Fetches a single task by id
export async function getHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params as unknown as IdParam;
  const task = await tasksService.getTask(ownerId(req), id);
  res.status(200).json({ data: task });
}

// Creates a new task under a project
export async function createHandler(req: Request, res: Response): Promise<void> {
  const task = await tasksService.createTask(ownerId(req), req.body as CreateTaskInput, {
    ip: req.ip,
  });
  res.status(201).json({ data: task });
}

// Updates an existing task
export async function updateHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params as unknown as IdParam;
  const task = await tasksService.updateTask(ownerId(req), id, req.body as UpdateTaskInput, {
    ip: req.ip,
  });
  res.status(200).json({ data: task });
}

// Deletes a task
export async function deleteHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params as unknown as IdParam;
  await tasksService.deleteTask(ownerId(req), id, { ip: req.ip });
  res.status(204).send();
}
