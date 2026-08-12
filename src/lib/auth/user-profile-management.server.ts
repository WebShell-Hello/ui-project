import "server-only";

import type { NextRequest } from "next/server";

import {
  MOCK_ROLE_COOKIE_NAME,
  parseAppRole,
} from "@/lib/access-control/role-access.data";

export type UserProfileManagementAuthorization =
  | { authorized: true }
  | { authorized: false; status: 401 | 403; message: string };

function getPublicOrigin(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost?.split(",")[0]?.trim() || request.headers.get("host");
  const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProtocol || request.nextUrl.protocol.replace(":", "");

  return host ? `${protocol}://${host}` : request.nextUrl.origin;
}

export function hasAllowedMutationOrigin(request: NextRequest) {
  const requestOrigin = request.headers.get("origin");

  return Boolean(requestOrigin && requestOrigin === getPublicOrigin(request));
}

export function authorizeUserProfileManagement(
  request: NextRequest,
  options: { mutation?: boolean } = {},
): UserProfileManagementAuthorization {
  const role = parseAppRole(request.cookies.get(MOCK_ROLE_COOKIE_NAME)?.value);

  if (!role) {
    return { authorized: false, status: 401, message: "Authentication is required." };
  }

  if (role !== "admin" && role !== "director") {
    return { authorized: false, status: 403, message: "Administrator access is required." };
  }

  if (options.mutation) {
    if (!hasAllowedMutationOrigin(request)) {
      return { authorized: false, status: 403, message: "The request origin is not allowed." };
    }
  }

  return { authorized: true };
}
