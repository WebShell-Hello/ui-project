import { type NextRequest, NextResponse } from "next/server";

import { resetLocalTestUserPassword } from "@/lib/auth/local-test-users.server";
import { authorizeUserProfileManagement } from "@/lib/auth/user-profile-management.server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const authorization = authorizeUserProfileManagement(request, { mutation: true });

  if (!authorization.authorized) {
    return NextResponse.json(
      { message: authorization.message },
      { status: authorization.status },
    );
  }

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { message: "Local test password reset is disabled in production." },
      { status: 403 },
    );
  }

  try {
    const { userId } = await params;
    await resetLocalTestUserPassword(userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Unable to reset the local password." }, { status: 500 });
  }
}
