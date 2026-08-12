import { cookies } from "next/headers";

import { MOCK_USER_ID_COOKIE_NAME } from "@/lib/access-control/role-access.data";
import { AUTH_MODE_COOKIE_NAME } from "@/lib/auth/auth.constants";
import { readPublicLocalTestUsers } from "@/lib/auth/local-test-users.server";

import { AccountSettings } from "./_components/account-settings";

export const dynamic = "force-dynamic";

export default async function Page() {
  const cookieStore = await cookies();
  const authMode = cookieStore.get(AUTH_MODE_COOKIE_NAME)?.value;
  const userId = cookieStore.get(MOCK_USER_ID_COOKIE_NAME)?.value;
  const user =
    authMode === "mock" && userId
      ? (await readPublicLocalTestUsers()).find((candidate) => candidate.id === userId)
      : undefined;

  return <AccountSettings user={user ?? null} isLocalAccount={authMode === "mock"} />;
}
