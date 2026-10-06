import { z } from 'zod';
import { taskPrioritySchema, taskStatusSchema, sortOrderSchema } from './enums.js';
import { dateStringSchema, paginationQuerySchema } from './common.schemas.js';

const nameSchema = z.string().trim().min(1, 'Name is required').max(200);
const descriptionSchema = z.string().trim().max(2000).optional();
const uuidSchema = z.string().uuid();

export const createTaskSchema = z
  .object({
    projectId: uuidSchema,
    name: nameSchema,
    description: descriptionSchema,
    priority: taskPrioritySchema.default('MEDIUM'),
    status: taskStatusSchema.default('PENDING'),
    dueDate: dateStringSchema,
  })
  .strict();
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z
  .object({
    name: nameSchema.optional(),
    description: descriptionSchema,
    priority: taskPrioritySchema.optional(),
    status: taskStatusSchema.optional(),
    dueDate: dateStringSchema.optional(),
  })
  .strict()
  .refine((val) => Object.keys(val).length > 0, 'At least one field must be provided');
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const taskQuerySchema = paginationQuerySchema
  .extend({
    projectId: uuidSchema.optional(),
    q: z.string().trim().max(200).optional(),
    status: taskStatusSchema.optional(),
    priority: taskPrioritySchema.optional(),
    dueBefore: dateStringSchema.optional(),
    sort: z.enum(['createdAt', 'dueDate', 'priority', 'name']).default('createdAt'),
    order: sortOrderSchema.default('desc'),
  })
  .strict();
export type TaskQuery = z.infer<typeof taskQuerySchema>;
