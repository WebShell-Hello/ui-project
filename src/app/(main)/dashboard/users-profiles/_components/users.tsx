"use client";
"use no memo";

import * as React from "react";

import {
  type ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { AlertCircle, Database, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  type PublicTestUser,
  SYSTEM_ROLES,
  type SystemRole,
} from "@/lib/auth/user-profile.types";

import { createUsersColumns } from "./users-columns";
import { UsersTable } from "./users-table";

type UserDataSource = "local" | "api";

type UserDraft = Pick<
  PublicTestUser,
  "id" | "username" | "userName" | "email" | "companyRole" | "team" | "systemRole"
>;

type UserFormErrors = Partial<Record<"username" | "userName" | "email" | "companyRole" | "team", string>>;

async function getResponseMessage(response: Response, fallback: string) {
  const body: unknown = await response.json().catch(() => null);

  if (body && typeof body === "object" && "message" in body && typeof body.message === "string") {
    return body.message;
  }

  return fallback;
}

export function Users({ initialUsers }: { initialUsers: PublicTestUser[] }) {
  const [users, setUsers] = React.useState(initialUsers);
  const [dataSource, setDataSource] = React.useState<UserDataSource>("local");
  const [sourceMessage, setSourceMessage] = React.useState<string | null>(null);
  const [isLoadingSource, setIsLoadingSource] = React.useState(false);
  const [draft, setDraft] = React.useState<UserDraft | null>(null);
  const [formErrors, setFormErrors] = React.useState<UserFormErrors>({});
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [userPendingReset, setUserPendingReset] = React.useState<PublicTestUser | null>(null);
  const [isResetting, setIsResetting] = React.useState(false);
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "userName", desc: false }]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const sourceRequestId = React.useRef(0);

  const openEditDialog = React.useCallback(
    (user: PublicTestUser) => {
      if (dataSource !== "local") {
        return;
      }

      setDraft({ ...user });
      setFormErrors({});
      setIsEditOpen(true);
    },
    [dataSource],
  );

  const openResetDialog = React.useCallback(
    (user: PublicTestUser) => {
      if (dataSource === "local") {
        setUserPendingReset(user);
      }
    },
    [dataSource],
  );

  const columns = React.useMemo(
    () => createUsersColumns({ onEdit: openEditDialog, onResetPassword: openResetDialog }),
    [openEditDialog, openResetDialog],
  );
  const table = useReactTable({
    data: users,
    columns,
    state: { sorting, columnFilters, pagination },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (user) => user.id,
    autoResetPageIndex: false,
    initialState: { columnVisibility: { search: false } },
  });
  const searchQuery = (table.getColumn("search")?.getFilterValue() as string | undefined) ?? "";

  async function changeDataSource(source: UserDataSource) {
    const requestId = sourceRequestId.current + 1;
    sourceRequestId.current = requestId;
    setDataSource(source);
    setSourceMessage(null);
    setIsLoadingSource(true);
    table.setPageIndex(0);

    try {
      const response = await fetch(`/api/users-profiles?source=${source}`, { cache: "no-store" });

      if (sourceRequestId.current !== requestId) {
        return;
      }

      if (!response.ok) {
        setUsers([]);
        setSourceMessage(await getResponseMessage(response, "Unable to load this data source."));
        return;
      }

      const body = (await response.json()) as { users: PublicTestUser[] };
      setUsers(body.users);
    } catch {
      if (sourceRequestId.current === requestId) {
        setUsers([]);
        setSourceMessage("Unable to reach the selected user data source.");
      }
    } finally {
      if (sourceRequestId.current === requestId) {
        setIsLoadingSource(false);
      }
    }
  }

  function updateDraft<K extends keyof UserDraft>(field: K, value: UserDraft[K]) {
    setDraft((currentDraft) => (currentDraft ? { ...currentDraft, [field]: value } : currentDraft));
  }

  async function saveUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft || dataSource !== "local") {
      return;
    }

    const errors: UserFormErrors = {};

    if (!draft.userName.trim()) errors.userName = "Enter the user's name.";
    if (!draft.username?.trim()) errors.username = "Enter a login username.";
    if (!draft.email.trim() || !draft.email.includes("@")) errors.email = "Enter a valid email address.";
    if (!draft.companyRole.trim()) errors.companyRole = "Enter a company role.";
    if (!draft.team.trim()) errors.team = "Enter a team.";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/users-profiles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });

      if (!response.ok) {
        toast.error(await getResponseMessage(response, "Unable to update this user."));
        return;
      }

      const body = (await response.json()) as { user: PublicTestUser };
      setUsers((currentUsers) =>
        currentUsers.map((user) => (user.id === body.user.id ? body.user : user)),
      );
      setIsEditOpen(false);
      toast.success(`${body.user.userName} was updated in src/data/test_users.ts.`);
    } catch {
      toast.error("Unable to reach the local user-management service.");
    } finally {
      setIsSaving(false);
    }
  }

  async function resetPassword() {
    if (!userPendingReset || dataSource !== "local") {
      return;
    }

    setIsResetting(true);

    try {
      const response = await fetch(
        `/api/users-profiles/${encodeURIComponent(userPendingReset.id)}/reset-password`,
        { method: "POST" },
      );

      if (!response.ok) {
        toast.error(await getResponseMessage(response, "Unable to reset this password."));
        return;
      }

      toast.success(`${userPendingReset.userName}'s password was reset to the local test default.`);
      setUserPendingReset(null);
    } catch {
      toast.error("Unable to reach the local user-management service.");
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl tracking-tight">Users Profiles</h1>
        <p className="text-muted-foreground text-sm">Manage the accounts used to sign in to this system.</p>
      </div>

      {sourceMessage ? (
        <Alert>
          <AlertCircle />
          <AlertTitle>Data source unavailable</AlertTitle>
          <AlertDescription>{sourceMessage}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="border-b has-data-[slot=card-action]:grid-cols-1 md:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
          <CardTitle>Login users</CardTitle>
          <CardDescription>
            Local edits are persisted to src/data/test_users.ts. Passwords are never returned to this page.
          </CardDescription>
          <CardAction className="col-start-1 row-start-auto flex w-full flex-wrap gap-2 md:col-start-2 md:row-span-2 md:row-start-1 md:w-auto md:flex-nowrap">
            <InputGroup className="w-full md:w-64">
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search users..."
                value={searchQuery}
                onChange={(event) => {
                  table.getColumn("search")?.setFilterValue(event.target.value || undefined);
                  table.setPageIndex(0);
                }}
              />
            </InputGroup>
            <Select
              value={dataSource}
              onValueChange={(value) => {
                void changeDataSource(value as UserDataSource);
              }}
            >
              <SelectTrigger className="w-full md:w-52" aria-label="User data source">
                <Database />
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectGroup>
                  <SelectItem value="local">Local Test Accounts</SelectItem>
                  <SelectItem value="api">Authentication API</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </CardAction>
        </CardHeader>
        <CardContent className="px-0">
          {isLoadingSource ? (
            <div className="flex h-40 items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="animate-spin" />
              <span>Loading users...</span>
            </div>
          ) : (
            <UsersTable table={table} />
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit login user</DialogTitle>
            <DialogDescription>Changes are written directly to the local test account file.</DialogDescription>
          </DialogHeader>
          {draft ? (
            <form
              className="flex flex-col gap-4"
              noValidate
              onSubmit={(event) => {
                void saveUser(event);
              }}
            >
              <FieldGroup className="grid gap-4 sm:grid-cols-2">
                <UserTextField
                  id="user-name"
                  label="Name"
                  value={draft.userName}
                  error={formErrors.userName}
                  onChange={(value) => updateDraft("userName", value)}
                />
                <UserTextField
                  id="user-username"
                  label="Login username"
                  value={draft.username ?? ""}
                  error={formErrors.username}
                  onChange={(value) => updateDraft("username", value)}
                />
                <UserTextField
                  id="user-email"
                  label="Email"
                  type="email"
                  value={draft.email}
                  error={formErrors.email}
                  onChange={(value) => updateDraft("email", value)}
                />
                <UserTextField
                  id="user-company-role"
                  label="Company role"
                  value={draft.companyRole}
                  error={formErrors.companyRole}
                  onChange={(value) => updateDraft("companyRole", value)}
                />
                <UserTextField
                  id="user-team"
                  label="Team"
                  value={draft.team}
                  error={formErrors.team}
                  onChange={(value) => updateDraft("team", value)}
                />
                <Field>
                  <FieldLabel htmlFor="user-system-role">System role</FieldLabel>
                  <Select
                    value={draft.systemRole}
                    onValueChange={(value) => updateDraft("systemRole", value as SystemRole)}
                  >
                    <SelectTrigger id="user-system-role" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {SYSTEM_ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              </FieldGroup>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="animate-spin" data-icon="inline-start" /> : null}
                  Save user
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(userPendingReset)}
        onOpenChange={(open) => {
          if (!open) {
            setUserPendingReset(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset {userPendingReset?.userName}&apos;s password?</AlertDialogTitle>
            <AlertDialogDescription>
              This writes the default local test password, <code>Testpassword123</code>, to src/data/test_users.ts. The
              user can use it immediately on the Local Test Accounts login mode.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isResetting}
              onClick={() => {
                void resetPassword();
              }}
            >
              {isResetting ? <Loader2 className="animate-spin" data-icon="inline-start" /> : null}
              Reset password
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function UserTextField({
  id,
  label,
  value,
  error,
  type = "text",
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  type?: React.ComponentProps<typeof Input>["type"];
  onChange: (value: string) => void;
}) {
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        type={type}
        value={value}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  );
}
