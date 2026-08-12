
export const APP_ROLES = ["admin", "director", "manager", "guest"] as const;

export type AppRole = (typeof APP_ROLES)[number];
export type AppRoute = `/${string}`;
export type RouteAccess = "all" | readonly AppRoute[];

export const MOCK_ROLE_COOKIE_NAME = "mock_role";
export const MOCK_USER_ID_COOKIE_NAME = "mock_user_id";
export interface RoleAccess {
  allowedRoutes: RouteAccess;
}

const authenticationRoutes = ["/auth/v1/login", "/auth/v1/register"] as const;
const accountRoute = "/dashboard/account" as const;


export const roleAccess: Record<AppRole, RoleAccess> = {
  admin: {
    allowedRoutes: "all",
  },
  director: {
    allowedRoutes: "all",
  },
  manager: {
    allowedRoutes: [
      accountRoute,
      "/dashboard/timesheets",
      "/dashboard/invoices",
      ...authenticationRoutes,
    ],
  },
  guest: {
    allowedRoutes: [accountRoute, ...authenticationRoutes],
  },
};

export const roleHomeRoutes: Record<AppRole, AppRoute> = {
  admin: "/dashboard/default",
  director: "/dashboard/default",
  manager: "/dashboard/timesheets",
  guest: "/auth/v1/login",
};

export function parseAppRole(value: string | null | undefined): AppRole | null {
  if (value && APP_ROLES.includes(value as AppRole)) {
    return value as AppRole;
  }

  return null;
}

export function canAccessRoute(role: AppRole, pathname: string): boolean {
  const access = roleAccess[role].allowedRoutes;

  if (access === "all") {
    return true;
  }

  return access.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
