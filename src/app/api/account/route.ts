import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  MOCK_ROLE_COOKIE_NAME,
  MOCK_USER_ID_COOKIE_NAME,
  parseAppRole,
} from "@/lib/access-control/role-access.data";
import { AUTH_MODE_COOKIE_NAME, AUTH_USERNAME_COOKIE_NAME } from "@/lib/auth/auth.constants";
import {
  changeLocalTestUserPassword,
  updateLocalTestUserAccountProfile,
} from "@/lib/auth/local-test-users.server";
import { hasAllowedMutationOrigin } from "@/lib/auth/user-profile-management.server";

const profileUpdateSchema = z.object({
  action: z.literal("profile"),
  username: z.string().trim().min(1).max(80),
  userName: z.string().trim().min(1).max(120),
});

const passwordUpdateSchema = z
  .object({
    action: z.literal("password"),
    currentPassword: z.string().min(1).max(128),
    newPassword: z.string().min(8).max(128),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "Choose a new password that is different from your current password.",
    path: ["newPassword"],
  });

const accountUpdateSchema = z.discriminatedUnion("action", [
  profileUpdateSchema,
  passwordUpdateSchema,
]);

const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

type LocalAccountAuthorization =
  | { authorized: true; userId: string }
  | { authorized: false; response: NextResponse };

function authorizeLocalAccountMutation(request: NextRequest): LocalAccountAuthorization {
  if (!parseAppRole(request.cookies.get(MOCK_ROLE_COOKIE_NAME)?.value)) {
    return {
      authorized: false,
      response: NextResponse.json({ message: "Authentication is required." }, { status: 401 }),
    };
  }

  const userId = request.cookies.get(MOCK_USER_ID_COOKIE_NAME)?.value;

  if (!userId) {
    return {
      authorized: false,
      response: NextResponse.json(
        { message: "The current user session is incomplete." },
        { status: 401 },
      ),
    };
  }

  if (request.cookies.get(AUTH_MODE_COOKIE_NAME)?.value !== "mock") {
    return {
      authorized: false,
      response: NextResponse.json(
        { message: "Account editing for the Authentication API has not been configured yet." },
        { status: 501 },
      ),
    };
  }

  if (!hasAllowedMutationOrigin(request)) {
    return {
      authorized: false,
      response: NextResponse.json(
        { message: "The request origin is not allowed." },
        { status: 403 },
      ),
    };
  }

  if (process.env.NODE_ENV === "production") {
    return {
      authorized: false,
      response: NextResponse.json(
        { message: "Local test account editing is disabled in production." },
        { status: 403 },
      ),
    };
  }

  return { authorized: true, userId };
}

export async function PATCH(request: NextRequest) {
  const authorization = authorizeLocalAccountMutation(request);

  if (!authorization.authorized) {
    return authorization.response;
  }

  const body: unknown = await request.json().catch(() => null);
  const parsedBody = accountUpdateSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { message: parsedBody.error.issues[0]?.message ?? "Enter valid account details." },
      { status: 400 },
    );
  }

  try {
    if (parsedBody.data.action === "profile") {
      const user = await updateLocalTestUserAccountProfile(authorization.userId, parsedBody.data);
      const response = NextResponse.json({ user });

      response.cookies.set(AUTH_USERNAME_COOKIE_NAME, user.username ?? "", sessionCookieOptions);
      return response;
    }

    await changeLocalTestUserPassword(
      authorization.userId,
      parsedBody.data.currentPassword,
      parsedBody.data.newPassword,
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return NextResponse.json({ message: "The current user was not found." }, { status: 404 });
    }

    if (error instanceof Error && error.message === "USERNAME_EXISTS") {
      return NextResponse.json({ message: "That username is already in use." }, { status: 409 });
    }

    if (error instanceof Error && error.message === "CURRENT_PASSWORD_INCORRECT") {
      return NextResponse.json({ message: "The current password is incorrect." }, { status: 400 });
    }

    return NextResponse.json({ message: "Unable to update the local account file." }, { status: 500 });
  }
}
