import { readPublicLocalTestUsers } from "@/lib/auth/local-test-users.server";

import { Users } from "./_components/users";

export const dynamic = "force-dynamic";

export default async function Page() {
  return <Users initialUsers={await readPublicLocalTestUsers()} />;
}
