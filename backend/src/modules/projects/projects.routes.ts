// Project routes: all require auth; body/query/params are validated before hitting the controller.
import { Router } from 'express';
import { createProjectSchema, idParamSchema, projectQuerySchema, updateProjectSchema } from '@pms/shared';
import { validate } from '../../middleware/validate.js';
import { requireAuth } from '../../middleware/auth.js';
import * as projectsController from './projects.controller.js';

export const projectsRouter = Router();

projectsRouter.use(requireAuth);

projectsRouter.get('/', validate({ query: projectQuerySchema }), projectsController.listHandler);
projectsRouter.get('/:id', validate({ params: idParamSchema }), projectsController.getHandler);
projectsRouter.post('/', validate({ body: createProjectSchema }), projectsController.createHandler);
projectsRouter.put(
  '/:id',
  validate({ params: idParamSchema, body: updateProjectSchema }),
  projectsController.updateHandler,
);
projectsRouter.delete('/:id', validate({ params: idParamSchema }), projectsController.deleteHandler);
