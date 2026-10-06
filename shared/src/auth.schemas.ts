import { z } from 'zod';
import { clientTypeSchema } from './enums.js';

const byteLength = (val: string): number => new TextEncoder().encode(val).length;

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Email is required')
  .email('Enter a valid email address');

export const passwordSchema = z
  .string()
  .min(1, 'Password is required')
  .refine((val) => byteLength(val) >= 8, 'Password must be at least 8 characters')
  .refine((val) => byteLength(val) <= 72, 'Password must be at most 72 bytes')
  .refine((val) => /[A-Za-z]/.test(val), 'Password must contain at least one letter')
  .refine((val) => /\d/.test(val), 'Password must contain at least one digit');

export const fullNameSchema = z.string().trim().min(1, 'Full name is required').max(120);

export const registerSchema = z
  .object({
    fullName: fullNameSchema,
    email: emailSchema,
    password: passwordSchema,
  })
  .strict();
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
  })
  .strict();
export type LoginInput = z.infer<typeof loginSchema>;

export const clientTypeHeaderSchema = clientTypeSchema;
