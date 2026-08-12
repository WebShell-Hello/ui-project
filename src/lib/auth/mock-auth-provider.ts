import type {
  AuthCredentials,
  AuthSession,
} from "./auth.types";
import { readLocalTestUsers } from "./local-test-users.server";
import { resolveAppRole } from "./resolve-app-role";

export async function authenticateWithMock(
  credentials: AuthCredentials,
): Promise<AuthSession | null> {
  const normalizedUsername = credentials.username.trim().toLowerCase();
  const testUsers = await readLocalTestUsers();

  const account = testUsers.find(
    (user) => user.username?.toLowerCase() === normalizedUsername,
  );

  if (!account || account.password !== credentials.password) {
    return null;
  }

  const role = resolveAppRole([
    account.companyRole,
    account.systemRole,
  ]);

  return {
    user: {
      id: account.id,
      username: account.username ?? normalizedUsername,
      displayName: account.userName,
      email: account.email,
      role,
    },
  };
}
