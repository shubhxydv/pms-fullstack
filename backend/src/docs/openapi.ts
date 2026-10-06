import { OpenAPIRegistry, OpenApiGeneratorV3, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import {
  registerSchema,
  loginSchema,
  createProjectSchema,
  updateProjectSchema,
  createTaskSchema,
  updateTaskSchema,
} from '@pms/shared';

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
  }),
});

const bearerAuth = registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

const jsonBody = (schema: z.ZodTypeAny) => ({
  content: { 'application/json': { schema } },
});

const errorResponses = {
  400: { description: 'Validation error', ...jsonBody(errorResponseSchema) },
  401: { description: 'Not authenticated', ...jsonBody(errorResponseSchema) },
  404: { description: 'Not found', ...jsonBody(errorResponseSchema) },
};

registry.registerPath({
  method: 'get',
  path: '/health',
  summary: 'Liveness check',
  responses: { 200: { description: 'OK' } },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/register',
  summary: 'Register a new account',
  request: { body: jsonBody(registerSchema) },
  responses: { 201: { description: 'Created' }, ...errorResponses },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/login',
  summary: 'Log in',
  request: { body: jsonBody(loginSchema) },
  responses: { 200: { description: 'OK' }, ...errorResponses },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/refresh',
  summary: 'Rotate the refresh token',
  responses: { 200: { description: 'OK' }, ...errorResponses },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/logout',
  summary: 'Revoke the current session',
  security: [{ [bearerAuth.name]: [] }],
  responses: { 204: { description: 'No Content' }, ...errorResponses },
});

registry.registerPath({
  method: 'get',
  path: '/api/auth/me',
  summary: 'Current user',
  security: [{ [bearerAuth.name]: [] }],
  responses: { 200: { description: 'OK' }, ...errorResponses },
});

registry.registerPath({
  method: 'get',
  path: '/api/projects',
  summary: 'List projects (search, filter, sort, pagination)',
  security: [{ [bearerAuth.name]: [] }],
  responses: { 200: { description: 'OK' }, ...errorResponses },
});

registry.registerPath({
  method: 'post',
  path: '/api/projects',
  summary: 'Create a project',
  security: [{ [bearerAuth.name]: [] }],
  request: { body: jsonBody(createProjectSchema) },
  responses: { 201: { description: 'Created' }, ...errorResponses },
});

registry.registerPath({
  method: 'get',
  path: '/api/projects/{id}',
  summary: 'Get a project',
  security: [{ [bearerAuth.name]: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: { 200: { description: 'OK' }, ...errorResponses },
});

registry.registerPath({
  method: 'put',
  path: '/api/projects/{id}',
  summary: 'Update a project',
  security: [{ [bearerAuth.name]: [] }],
  request: { params: z.object({ id: z.string().uuid() }), body: jsonBody(updateProjectSchema) },
  responses: { 200: { description: 'OK' }, ...errorResponses },
});

registry.registerPath({
  method: 'delete',
  path: '/api/projects/{id}',
  summary: 'Delete a project (cascades tasks)',
  security: [{ [bearerAuth.name]: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: { 204: { description: 'No Content' }, ...errorResponses },
});

registry.registerPath({
  method: 'get',
  path: '/api/tasks',
  summary: 'List tasks (search, filter, sort, pagination)',
  security: [{ [bearerAuth.name]: [] }],
  responses: { 200: { description: 'OK' }, ...errorResponses },
});

registry.registerPath({
  method: 'post',
  path: '/api/tasks',
  summary: 'Create a task',
  security: [{ [bearerAuth.name]: [] }],
  request: { body: jsonBody(createTaskSchema) },
  responses: { 201: { description: 'Created' }, ...errorResponses },
});

registry.registerPath({
  method: 'get',
  path: '/api/tasks/{id}',
  summary: 'Get a task',
  security: [{ [bearerAuth.name]: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: { 200: { description: 'OK' }, ...errorResponses },
});

registry.registerPath({
  method: 'put',
  path: '/api/tasks/{id}',
  summary: 'Update a task (partial; use status: COMPLETED to mark done)',
  security: [{ [bearerAuth.name]: [] }],
  request: { params: z.object({ id: z.string().uuid() }), body: jsonBody(updateTaskSchema) },
  responses: { 200: { description: 'OK' }, ...errorResponses },
});

registry.registerPath({
  method: 'delete',
  path: '/api/tasks/{id}',
  summary: 'Delete a task',
  security: [{ [bearerAuth.name]: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: { 204: { description: 'No Content' }, ...errorResponses },
});

registry.registerPath({
  method: 'get',
  path: '/api/dashboard',
  summary: 'Per-user dashboard summary',
  security: [{ [bearerAuth.name]: [] }],
  responses: { 200: { description: 'OK' }, ...errorResponses },
});

export function buildOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'PMS API',
      version: '1.0.0',
      description: 'Project Management System API (projects, tasks, auth, dashboard).',
    },
    servers: [{ url: '/' }],
  });
}
