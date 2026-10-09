// Shape of a logged-in user as returned by the auth API.
import type { Role } from '@pms/shared';

export interface UserDto {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  createdAt: string;
}
