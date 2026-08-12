import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  readPublicLocalTestUsers,
  updateLocalTestUser,
} from "@/lib/auth/local-test-users.server";
import { SYSTEM_ROLES } from "@/lib/auth/user-profile.types";
import { authorizeUserProfileManagement } from "@/lib/auth/user-profile-management.server";

const updateUserSchema = z.object({
  id: z.string().trim().min(1),
  username: z.string().trim().min(1),
  userName: z.string().trim().min(1),
  email: z.string().trim().email(),
  companyRole: z.string().trim().min(1),
  team: z.string().trim().min(1),
  systemRole: z.enum(SYSTEM_ROLES),
});

function authorizationResponse(request: NextRequest, mutation = false) {
  const authorization = authorizeUserProfileManagement(request, { mutation });

  return authorization.authorized
    ? null
    : NextResponse.json({ message: authorization.message }, { status: authorization.status });
}

export async function GET(request: NextRequest) {
  const unauthorizedResponse = authorizationResponse(request);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  if (request.nextUrl.searchParams.get("source") === "api") {
    return NextResponse.json(
      { message: "The user-management API data source has not been configured yet." },
      { status: 501 },
    );
  }

  return NextResponse.json({ users: await readPublicLocalTestUsers() });
}

export async function PATCH(request: NextRequest) {
  const unauthorizedResponse = authorizationResponse(request, true);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { message: "Local test account editing is disabled in production." },
      { status: 403 },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  const parsedBody = updateUserSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { message: "Enter a valid name, username, email, role and team." },
      { status: 400 },
    );
  }

  try {
    const user = await updateLocalTestUser(parsedBody.data.id, parsedBody.data);
    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    if (error instanceof Error && error.message === "USERNAME_EXISTS") {
      return NextResponse.json({ message: "That username is already in use." }, { status: 409 });
    }

    if (error instanceof Error && error.message === "EMAIL_EXISTS") {
      return NextResponse.json({ message: "That email address is already in use." }, { status: 409 });
    }

    return NextResponse.json({ message: "Unable to update the local user file." }, { status: 500 });
  }
}
