import type { User } from '@prisma/client';

export interface UserDto {
  id: string;
  fullName: string;
  email: string;
  role: User['role'];
  createdAt: string;
}

export function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}
