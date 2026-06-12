export type UserRole = 'ADMIN' | 'COACH';

export interface AuthUser {
  username: string;
  role: UserRole;
  mustChangePassword: boolean;
  teamName?: string;
}

export interface LoginResponse {
  token: string;
  mustChangePassword: boolean;
  role: UserRole;
  teamName?: string;
}

export interface CoachListItem {
  id: number;
  username: string;
  email: string;
  teamName: string;
  active: boolean;
}

export interface TeamOption {
  teamName: string;
  logoUrl: string | null;
}
