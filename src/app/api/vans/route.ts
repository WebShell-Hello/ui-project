import { type NextRequest, NextResponse } from "next/server";

import { authorizeUserProfileManagement } from "@/lib/auth/user-profile-management.server";
import { writeVanData } from "@/lib/local-business-data.server";
import { vanDataSchema } from "@/lib/local-business-data.schemas";

export async function PUT(request: NextRequest) {
  const authorization = authorizeUserProfileManagement(request, { mutation: true });

  if (!authorization.authorized) {
    return NextResponse.json({ message: authorization.message }, { status: authorization.status });
  }

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ message: "Local van editing is disabled in production." }, { status: 403 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsedBody = vanDataSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json({ message: "The van data is invalid." }, { status: 400 });
  }

  try {
    await writeVanData(parsedBody.data.vans);
    return NextResponse.json(parsedBody.data);
  } catch {
    return NextResponse.json({ message: "Unable to update src/data/vans.json." }, { status: 500 });
  }
}
