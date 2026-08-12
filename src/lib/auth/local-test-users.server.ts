import "server-only";

import { readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import type { PublicTestUser, TestUser } from "@/lib/auth/user-profile.types";

export const DEFAULT_TEST_USER_PASSWORD = "Testpassword123";

const testUsersFilePath = path.join(process.cwd(), "src", "data", "test_users.ts");
const requiredFields = [
  "id",
  "userName",
  "email",
  "password",
  "companyRole",
  "team",
  "systemRole",
] as const;

function parseTestUsers(source: string): TestUser[] {
  const arrayStart = source.indexOf("export const testUsers");
  const assignmentMarker = source.indexOf("=", arrayStart);
  const assignmentStart = source.indexOf("[", assignmentMarker);
  const arrayEnd = source.lastIndexOf("];");

  if (
    arrayStart === -1 ||
    assignmentMarker === -1 ||
    assignmentStart === -1 ||
    arrayEnd <= assignmentStart
  ) {
    throw new Error("Unable to find the testUsers array in src/data/test_users.ts.");
  }

  const objectBlocks = source.slice(assignmentStart + 1, arrayEnd).match(/\{[\s\S]*?\}/g) ?? [];

  return objectBlocks.map((objectBlock, index) => {
    const values = new Map<string, string>();

    for (const field of [...requiredFields, "username"] as const) {
      const propertyPattern = new RegExp(
        `(?:^|\\n)\\s*"?${field}"?\\s*:\\s*("(?:\\\\.|[^"\\\\])*")`,
      );
      const propertyMatch = objectBlock.match(propertyPattern);

      if (propertyMatch?.[1]) {
        values.set(field, JSON.parse(propertyMatch[1]) as string);
      }
    }

    for (const field of requiredFields) {
      if (!values.has(field)) {
        throw new Error(`Test user at index ${index} is missing ${field}.`);
      }
    }

    return {
      id: values.get("id")!,
      username: values.get("username"),
      userName: values.get("userName")!,
      email: values.get("email")!,
      password: values.get("password")!,
      companyRole: values.get("companyRole")!,
      team: values.get("team")!,
      systemRole: values.get("systemRole")! as TestUser["systemRole"],
    };
  });
}

function serializeTestUsers(users: TestUser[]) {
  return `import type { TestUser } from "@/lib/auth/user-profile.types";

export type { SystemRole, TestUser } from "@/lib/auth/user-profile.types";

export const testUsers: TestUser[] = ${JSON.stringify(users, null, 2)};
`;
}

async function readUsers() {
  return parseTestUsers(await readFile(testUsersFilePath, "utf8"));
}

async function writeUsers(users: TestUser[]) {
  const temporaryPath = `${testUsersFilePath}.${process.pid}.${Date.now()}.tmp`;

  try {
    await writeFile(temporaryPath, serializeTestUsers(users), "utf8");
    await rename(temporaryPath, testUsersFilePath);
  } finally {
    await rm(temporaryPath, { force: true }).catch(() => undefined);
  }
}

let writeQueue: Promise<void> = Promise.resolve();

export async function readLocalTestUsers() {
  return readUsers();
}

export async function readPublicLocalTestUsers(): Promise<PublicTestUser[]> {
  return (await readUsers()).map(({ password: _password, ...user }) => user);
}

export function updateLocalTestUser(
  id: string,
  update: Pick<TestUser, "username" | "userName" | "email" | "companyRole" | "team" | "systemRole">,
) {
  let updatedUser: PublicTestUser | null = null;

  const operation = writeQueue.then(async () => {
    const users = await readUsers();
    const userIndex = users.findIndex((user) => user.id === id);

    if (userIndex === -1) {
      throw new Error("USER_NOT_FOUND");
    }

    const normalizedUsername = update.username?.trim().toLowerCase();
    const normalizedEmail = update.email.trim().toLowerCase();
    const hasDuplicateUsername = users.some(
      (user, index) =>
        index !== userIndex && user.username?.trim().toLowerCase() === normalizedUsername,
    );
    const hasDuplicateEmail = users.some(
      (user, index) => index !== userIndex && user.email.trim().toLowerCase() === normalizedEmail,
    );

    if (hasDuplicateUsername) {
      throw new Error("USERNAME_EXISTS");
    }

    if (hasDuplicateEmail) {
      throw new Error("EMAIL_EXISTS");
    }

    const nextUser: TestUser = {
      ...users[userIndex],
      ...update,
      username: update.username?.trim() || undefined,
      userName: update.userName.trim(),
      email: update.email.trim(),
      companyRole: update.companyRole.trim(),
      team: update.team.trim(),
    };
    const nextUsers = users.map((user, index) => (index === userIndex ? nextUser : user));

    await writeUsers(nextUsers);
    const { password: _password, ...publicUser } = nextUser;
    updatedUser = publicUser;
  });

  writeQueue = operation.catch(() => undefined);

  return operation.then(() => updatedUser!);
}

export function updateLocalTestUserAccountProfile(
  id: string,
  update: Pick<TestUser, "username" | "userName">,
) {
  let updatedUser: PublicTestUser | null = null;

  const operation = writeQueue.then(async () => {
    const users = await readUsers();
    const userIndex = users.findIndex((user) => user.id === id);

    if (userIndex === -1) {
      throw new Error("USER_NOT_FOUND");
    }

    const normalizedUsername = update.username?.trim().toLowerCase();
    const hasDuplicateUsername = users.some(
      (user, index) =>
        index !== userIndex && user.username?.trim().toLowerCase() === normalizedUsername,
    );

    if (hasDuplicateUsername) {
      throw new Error("USERNAME_EXISTS");
    }

    const nextUser: TestUser = {
      ...users[userIndex],
      username: update.username?.trim() || undefined,
      userName: update.userName.trim(),
    };
    const nextUsers = users.map((user, index) => (index === userIndex ? nextUser : user));

    await writeUsers(nextUsers);
    const { password: _password, ...publicUser } = nextUser;
    updatedUser = publicUser;
  });

  writeQueue = operation.catch(() => undefined);

  return operation.then(() => updatedUser!);
}

export function changeLocalTestUserPassword(
  id: string,
  currentPassword: string,
  newPassword: string,
) {
  const operation = writeQueue.then(async () => {
    const users = await readUsers();
    const userIndex = users.findIndex((user) => user.id === id);

    if (userIndex === -1) {
      throw new Error("USER_NOT_FOUND");
    }

    if (users[userIndex].password !== currentPassword) {
      throw new Error("CURRENT_PASSWORD_INCORRECT");
    }

    const nextUsers = users.map((user, index) =>
      index === userIndex ? { ...user, password: newPassword } : user,
    );

    await writeUsers(nextUsers);
  });

  writeQueue = operation.catch(() => undefined);

  return operation;
}

export function resetLocalTestUserPassword(id: string) {
  const operation = writeQueue.then(async () => {
    const users = await readUsers();
    const userIndex = users.findIndex((user) => user.id === id);

    if (userIndex === -1) {
      throw new Error("USER_NOT_FOUND");
    }

    const nextUsers = users.map((user, index) =>
      index === userIndex ? { ...user, password: DEFAULT_TEST_USER_PASSWORD } : user,
    );

    await writeUsers(nextUsers);
  });

  writeQueue = operation.catch(() => undefined);

  return operation;
}
