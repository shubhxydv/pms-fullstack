// Converts the Prisma User model into the safe shape sent to clients (no password hash).
import type { User } from '@prisma/client';

export interface UserDto {
  id: string;
  fullName: string;
  email: string;
  role: User['role'];
  createdAt: string;
}

// Strips sensitive fields before sending user
export function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}
