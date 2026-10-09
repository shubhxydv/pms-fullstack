// Fixed value sets reused across the whole app — one definition, everywhere.
import { z } from 'zod';

// User access level
export const roleSchema = z.enum(['USER', 'ADMIN']);
export type Role = z.infer<typeof roleSchema>;

// Lifecycle stage of a project
export const projectStatusSchema = z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']);
export type ProjectStatus = z.infer<typeof projectStatusSchema>;

// Lifecycle stage of a task
export const taskStatusSchema = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']);
export type TaskStatus = z.infer<typeof taskStatusSchema>;

// Urgency level of a task
export const taskPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);
export type TaskPriority = z.infer<typeof taskPrioritySchema>;

// Device OS for push tokens
export const platformSchema = z.enum(['ANDROID', 'IOS']);
export type Platform = z.infer<typeof platformSchema>;

// Which app made the request
export const clientTypeSchema = z.enum(['web', 'mobile']);
export type ClientType = z.infer<typeof clientTypeSchema>;

// List ordering direction
export const sortOrderSchema = z.enum(['asc', 'desc']);
export type SortOrder = z.infer<typeof sortOrderSchema>;
