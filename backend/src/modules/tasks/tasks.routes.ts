// Task routes: all require auth; body/query/params are validated before hitting the controller.
import { Router } from 'express';
import { createTaskSchema, idParamSchema, taskQuerySchema, updateTaskSchema } from '@pms/shared';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import * as tasksController from './tasks.controller.js';

export const tasksRouter = Router();

tasksRouter.use(requireAuth);

tasksRouter.get('/', validate({ query: taskQuerySchema }), tasksController.listHandler);
tasksRouter.get('/:id', validate({ params: idParamSchema }), tasksController.getHandler);
tasksRouter.post('/', validate({ body: createTaskSchema }), tasksController.createHandler);
tasksRouter.put(
  '/:id',
  validate({ params: idParamSchema, body: updateTaskSchema }),
  tasksController.updateHandler,
);
tasksRouter.delete('/:id', validate({ params: idParamSchema }), tasksController.deleteHandler);
