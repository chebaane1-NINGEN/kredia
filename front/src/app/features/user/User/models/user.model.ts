export type UserRole = 'ADMIN' | 'CLIENT' | 'AGENT';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface User {
  userId?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  createdAt?: string;
}
