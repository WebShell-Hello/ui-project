export const SYSTEM_ROLES = ["Director", "Accounts", "Manager", "Recruitment", "Fleet"] as const;

export type SystemRole = (typeof SYSTEM_ROLES)[number];

export interface TestUser {
  id: string;
  username?: string;
  userName: string;
  email: string;
  password: string;
  companyRole: string;
  team: string;
  systemRole: SystemRole;
}

export type PublicTestUser = Omit<TestUser, "password">;
