export type UserRole = "teacher" | "school_admin" | "student";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  schoolId: string;
  classId?: string;
}

export interface SessionData {
  user: AuthUser;
  expiresAt: number;
}
