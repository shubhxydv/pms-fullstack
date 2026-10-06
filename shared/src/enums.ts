import { z } from 'zod';

export const roleSchema = z.enum(['USER', 'ADMIN']);
export type Role = z.infer<typeof roleSchema>;

export const projectStatusSchema = z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']);
export type ProjectStatus = z.infer<typeof projectStatusSchema>;

export const taskStatusSchema = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']);
export type TaskStatus = z.infer<typeof taskStatusSchema>;

export const taskPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);
export type TaskPriority = z.infer<typeof taskPrioritySchema>;

export const platformSchema = z.enum(['ANDROID', 'IOS']);
export type Platform = z.infer<typeof platformSchema>;

export const clientTypeSchema = z.enum(['web', 'mobile']);
export type ClientType = z.infer<typeof clientTypeSchema>;

export const sortOrderSchema = z.enum(['asc', 'desc']);
export type SortOrder = z.infer<typeof sortOrderSchema>;
