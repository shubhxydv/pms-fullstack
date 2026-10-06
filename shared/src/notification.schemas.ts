import { z } from 'zod';
import { platformSchema } from './enums.js';

export const registerTokenSchema = z
  .object({
    token: z.string().trim().min(1, 'Token is required'),
    platform: platformSchema,
  })
  .strict();
export type RegisterTokenInput = z.infer<typeof registerTokenSchema>;
