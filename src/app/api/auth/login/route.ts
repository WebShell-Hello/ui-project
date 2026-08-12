import { NextResponse } from "next/server";
import { z } from "zod";

import {
  MOCK_ROLE_COOKIE_NAME,
  MOCK_USER_ID_COOKIE_NAME,
  roleHomeRoutes,
} from "@/lib/access-control/role-access.data";
import {
  ACCESS_TOKEN_COOKIE_NAME,
  AUTH_MODE_COOKIE_NAME,
  AUTH_USERNAME_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from "@/lib/auth/auth.constants";
import {
  AuthApiUnavailableError,
  InvalidAuthApiResponseError,
} from "@/lib/auth/api-auth-provider";
import {
  authenticate,
  MockAuthDisabledError,
} from "@/lib/auth/authenticate";
import {
  AUTH_MODES,
  type AuthMode,
  type AuthSession,
} from "@/lib/auth/auth.types";

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
  authMode: z.enum(AUTH_MODES),
  remember: z.boolean().optional(),
});

const baseCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

const defaultSessionMaxAge = 60 * 60;
const rememberedSessionMaxAge = 60 * 60 * 24 * 7;

function expireCookie(
  response: NextResponse,
  name: string,
) {
  response.cookies.set(name, "", {
    ...baseCookieOptions,
    maxAge: 0,
  });
}

function setSessionCookies(
  response: NextResponse,
  session: AuthSession,
  authMode: AuthMode,
  remember: boolean,
) {
  const sessionMaxAge = remember
    ? rememberedSessionMaxAge
    : defaultSessionMaxAge;

  response.cookies.set(
    MOCK_ROLE_COOKIE_NAME,
    session.user.role,
    {
      ...baseCookieOptions,
      maxAge: sessionMaxAge,
    },
  );

  response.cookies.set(
    MOCK_USER_ID_COOKIE_NAME,
    session.user.id,
    {
      ...baseCookieOptions,
      maxAge: sessionMaxAge,
    },
  );

  response.cookies.set(
    AUTH_USERNAME_COOKIE_NAME,
    session.user.username,
    {
      ...baseCookieOptions,
      maxAge: sessionMaxAge,
    },
  );

  response.cookies.set(
    AUTH_MODE_COOKIE_NAME,
    authMode,
    {
      ...baseCookieOptions,
      maxAge: sessionMaxAge,
    },
  );

  if (authMode === "api" && session.tokens) {
    response.cookies.set(
      ACCESS_TOKEN_COOKIE_NAME,
      session.tokens.access,
      {
        ...baseCookieOptions,
        maxAge: 60 * 60,
      },
    );

    response.cookies.set(
      REFRESH_TOKEN_COOKIE_NAME,
      session.tokens.refresh,
      {
        ...baseCookieOptions,
        maxAge: remember
          ? rememberedSessionMaxAge
          : 60 * 60 * 24,
      },
    );

    return;
  }

  expireCookie(response, ACCESS_TOKEN_COOKIE_NAME);
  expireCookie(response, REFRESH_TOKEN_COOKIE_NAME);
}

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsedBody = loginSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      { message: "Please enter a username and password." },
      { status: 400 },
    );
  }

  try {
    const session = await authenticate(
      parsedBody.data.authMode,
      {
        username: parsedBody.data.username,
        password: parsedBody.data.password,
      },
    );

    if (!session) {
      return NextResponse.json(
        { message: "Username or password is incorrect." },
        { status: 401 },
      );
    }

    const redirectTo = roleHomeRoutes[session.user.role];

    const response = NextResponse.json({
      user: session.user,
      role: session.user.role,
      redirectTo,
    });

    setSessionCookies(
      response,
      session,
      parsedBody.data.authMode,
      Boolean(parsedBody.data.remember),
    );

    return response;
  } catch (error) {
    if (error instanceof MockAuthDisabledError) {
      return NextResponse.json(
        { message: error.message },
        { status: 403 },
      );
    }

    if (error instanceof AuthApiUnavailableError) {
      return NextResponse.json(
        {
          message:
            "The authentication API is unavailable. You can switch to Local Test Accounts.",
        },
        { status: 503 },
      );
    }

    if (error instanceof InvalidAuthApiResponseError) {
      return NextResponse.json(
        { message: error.message },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { message: "Unable to sign in. Please try again." },
      { status: 500 },
    );
  }
}
