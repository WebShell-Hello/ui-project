import { type NextRequest, NextResponse } from "next/server";

import { authorizeUserProfileManagement } from "@/lib/auth/user-profile-management.server";
import {
  deleteModuleConfigurationFile,
  readModuleConfigurationFile,
  writeModuleConfigurationFile,
} from "@/lib/module-configuration-file.server";
import { moduleConfigurationSchema } from "@/navigation/sidebar/module-configuration.shared";

function authorize(request: NextRequest, mutation = false) {
  const authorization = authorizeUserProfileManagement(request, { mutation });

  return authorization.authorized
    ? null
    : NextResponse.json({ message: authorization.message }, { status: authorization.status });
}

function localWriteDisabledResponse() {
  return NextResponse.json(
    { message: "Local module configuration editing is disabled in production." },
    { status: 403 },
  );
}

export async function GET(request: NextRequest) {
  const unauthorizedResponse = authorize(request);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  return NextResponse.json({ modules: await readModuleConfigurationFile() });
}

export async function PUT(request: NextRequest) {
  const unauthorizedResponse = authorize(request, true);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  if (process.env.NODE_ENV === "production") {
    return localWriteDisabledResponse();
  }

  const body: unknown = await request.json().catch(() => null);
  const parsedBody = moduleConfigurationSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json({ message: "The module configuration is invalid." }, { status: 400 });
  }

  try {
    await writeModuleConfigurationFile(parsedBody.data.modules);
    return NextResponse.json({ modules: parsedBody.data.modules });
  } catch {
    return NextResponse.json(
      { message: "Unable to update the local module configuration file." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const unauthorizedResponse = authorize(request, true);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  if (process.env.NODE_ENV === "production") {
    return localWriteDisabledResponse();
  }

  try {
    await deleteModuleConfigurationFile();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { message: "Unable to remove the local module configuration file." },
      { status: 500 },
    );
  }
}
