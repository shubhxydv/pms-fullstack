// Validation rule for registering a device push token.
import { z } from 'zod';
import { platformSchema } from './enums.js';

// Shape of a push-token registration request
export const registerTokenSchema = z
  .object({
    token: z.string().trim().min(1, 'Token is required'),
    platform: platformSchema,
  })
  .strict();
export type RegisterTokenInput = z.infer<typeof registerTokenSchema>;
