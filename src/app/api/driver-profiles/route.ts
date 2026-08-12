import { type NextRequest, NextResponse } from "next/server";

import { authorizeUserProfileManagement } from "@/lib/auth/user-profile-management.server";
import { writeDriverData } from "@/lib/local-business-data.server";
import { driverDataSchema } from "@/lib/local-business-data.schemas";

export async function PUT(request: NextRequest) {
  const authorization = authorizeUserProfileManagement(request, { mutation: true });

  if (!authorization.authorized) {
    return NextResponse.json({ message: authorization.message }, { status: authorization.status });
  }

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ message: "Local driver editing is disabled in production." }, { status: 403 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsedBody = driverDataSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json({ message: "The driver profile data is invalid." }, { status: 400 });
  }

  try {
    await writeDriverData(parsedBody.data.drivers);
    return NextResponse.json(parsedBody.data);
  } catch {
    return NextResponse.json({ message: "Unable to update src/data/driver-profiles.json." }, { status: 500 });
  }
}
