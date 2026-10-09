// Validation rules for register/login request bodies.
import { z } from 'zod';
import { clientTypeSchema } from './enums.js';

// UTF-8 byte count, since bcrypt caps input at 72 bytes
const byteLength = (val: string): number => new TextEncoder().encode(val).length;

// Normalizes and validates an email address
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Email is required')
  .email('Enter a valid email address');

// Enforces password length and complexity
export const passwordSchema = z
  .string()
  .min(1, 'Password is required')
  .refine((val) => byteLength(val) >= 8, 'Password must be at least 8 characters')
  .refine((val) => byteLength(val) <= 72, 'Password must be at most 72 bytes')
  .refine((val) => /[A-Za-z]/.test(val), 'Password must contain at least one letter')
  .refine((val) => /\d/.test(val), 'Password must contain at least one digit');

export const fullNameSchema = z.string().trim().min(1, 'Full name is required').max(120);

// Shape of a signup request
export const registerSchema = z
  .object({
    fullName: fullNameSchema,
    email: emailSchema,
    password: passwordSchema,
  })
  .strict();
export type RegisterInput = z.infer<typeof registerSchema>;

// Shape of a login request
export const loginSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
  })
  .strict();
export type LoginInput = z.infer<typeof loginSchema>;

export const clientTypeHeaderSchema = clientTypeSchema;
