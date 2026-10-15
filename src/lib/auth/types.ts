export type UserRole = "teacher" | "school_admin" | "student";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  schoolId: string;
  classId?: string;
  phone?: string;
  institutionName?: string;
  gradesTaught?: string[];
  subjectsTaught?: string[];
  designation?: string;
  status?: string;
}

export interface SessionData {
  user: AuthUser;
  expiresAt: number;
}
