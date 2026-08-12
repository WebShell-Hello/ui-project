import { type NextRequest, NextResponse } from "next/server";

import { authorizeUserProfileManagement } from "@/lib/auth/user-profile-management.server";
import { writeDocumentManagerState } from "@/lib/local-business-data.server";
import { documentManagerStateSchema } from "@/lib/local-business-data.schemas";

export async function PUT(request: NextRequest) {
  const authorization = authorizeUserProfileManagement(request, { mutation: true });

  if (!authorization.authorized) {
    return NextResponse.json({ message: authorization.message }, { status: authorization.status });
  }

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ message: "Local document editing is disabled in production." }, { status: 403 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsedBody = documentManagerStateSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json({ message: "The document manager data is invalid." }, { status: 400 });
  }

  try {
    await writeDocumentManagerState(parsedBody.data);
    return NextResponse.json(parsedBody.data);
  } catch {
    return NextResponse.json({ message: "Unable to update src/data/document-manager.json." }, { status: 500 });
  }
}
