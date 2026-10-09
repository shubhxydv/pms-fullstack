// Single shared Prisma client instance used for all database access.
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
