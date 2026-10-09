// Validation rules for creating, updating, and listing projects.
import { z } from 'zod';
import { projectStatusSchema, sortOrderSchema } from './enums.js';
import { dateStringSchema, paginationQuerySchema } from './common.schemas.js';

const nameSchema = z.string().trim().min(1, 'Name is required').max(200);
const descriptionSchema = z.string().trim().max(2000).optional();

// Shape of a create-project request
export const createProjectSchema = z
  .object({
    name: nameSchema,
    description: descriptionSchema,
    status: projectStatusSchema.default('NOT_STARTED'),
    startDate: dateStringSchema,
    endDate: dateStringSchema,
  })
  .strict()
  .refine((val) => val.endDate >= val.startDate, {
    message: 'End date must be on or after start date',
    path: ['endDate'],
  });
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

// Shape of a partial-update project request
export const updateProjectSchema = z
  .object({
    name: nameSchema.optional(),
    description: descriptionSchema,
    status: projectStatusSchema.optional(),
    startDate: dateStringSchema.optional(),
    endDate: dateStringSchema.optional(),
  })
  .strict()
  .refine((val) => Object.keys(val).length > 0, 'At least one field must be provided')
  .refine(
    (val) => !(val.startDate && val.endDate) || val.endDate >= val.startDate,
    { message: 'End date must be on or after start date', path: ['endDate'] },
  );
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

// Query params for filtering/sorting/paging the project list
export const projectQuerySchema = paginationQuerySchema
  .extend({
    q: z.string().trim().max(200).optional(),
    status: projectStatusSchema.optional(),
    sort: z.enum(['createdAt', 'name', 'startDate', 'endDate']).default('createdAt'),
    order: sortOrderSchema.default('desc'),
  })
  .strict();
export type ProjectQuery = z.infer<typeof projectQuerySchema>;
