"use client";

import * as React from "react";

import { AlertCircle, CheckCircle2, KeyRound, Save, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import type { PublicTestUser } from "@/lib/auth/user-profile.types";

interface AccountSettingsProps {
  readonly user: PublicTestUser | null;
  readonly isLocalAccount: boolean;
}

interface ProfileFormErrors {
  username?: string;
  userName?: string;
}

interface PasswordFormErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

async function getResponseMessage(response: Response, fallback: string) {
  const body: unknown = await response.json().catch(() => null);

  if (body && typeof body === "object" && "message" in body && typeof body.message === "string") {
    return body.message;
  }

  return fallback;
}

export function AccountSettings({ user, isLocalAccount }: AccountSettingsProps) {
  const router = useRouter();
  const [username, setUsername] = React.useState(user?.username ?? "");
  const [userName, setUserName] = React.useState(user?.userName ?? "");
  const [profileErrors, setProfileErrors] = React.useState<ProfileFormErrors>({});
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [passwordErrors, setPasswordErrors] = React.useState<PasswordFormErrors>({});
  const [isSavingPassword, setIsSavingPassword] = React.useState(false);

  if (!isLocalAccount) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeading />
        <Alert>
          <AlertCircle />
          <AlertTitle>Authentication API account</AlertTitle>
          <AlertDescription>
            Account editing for the Authentication API has not been configured yet. This page currently writes only
            to local test accounts.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeading />
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Account unavailable</AlertTitle>
          <AlertDescription>The signed-in account could not be found in src/data/test_users.ts.</AlertDescription>
        </Alert>
      </div>
    );
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors: ProfileFormErrors = {};

    if (!username.trim()) errors.username = "Enter a login username.";
    if (!userName.trim()) errors.userName = "Enter your name.";

    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      return;
    }

    setProfileErrors({});
    setIsSavingProfile(true);

    try {
      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "profile", username, userName }),
      });

      if (!response.ok) {
        toast.error(await getResponseMessage(response, "Unable to update your account."));
        return;
      }

      const body = (await response.json()) as { user: PublicTestUser };
      setUsername(body.user.username ?? "");
      setUserName(body.user.userName);
      toast.success("Your account details were saved to src/data/test_users.ts.");
      router.refresh();
    } catch {
      toast.error("Unable to reach the local account service.");
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function savePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors: PasswordFormErrors = {};

    if (!currentPassword) errors.currentPassword = "Enter your current password.";
    if (newPassword.length < 8) errors.newPassword = "Use at least 8 characters.";
    if (newPassword === currentPassword && newPassword) errors.newPassword = "Choose a different password.";
    if (confirmPassword !== newPassword) errors.confirmPassword = "The passwords do not match.";

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setPasswordErrors({});
    setIsSavingPassword(true);

    try {
      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "password", currentPassword, newPassword }),
      });

      if (!response.ok) {
        toast.error(await getResponseMessage(response, "Unable to change your password."));
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Your password was updated in src/data/test_users.ts.");
    } catch {
      toast.error("Unable to reach the local account service.");
    } finally {
      setIsSavingPassword(false);
    }
  }

  return (
    <div className="flex max-w-4xl flex-col gap-4">
      <PageHeading />

      <Alert>
        <CheckCircle2 />
        <AlertTitle>Local test account</AlertTitle>
        <AlertDescription>
          Changes on this page are written directly to src/data/test_users.ts and apply to your next login.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRound />
            Personal details
          </CardTitle>
          <CardDescription>Update the name shown in the dashboard and the username used to sign in.</CardDescription>
        </CardHeader>
        <form noValidate onSubmit={saveProfile}>
          <CardContent>
            <FieldGroup>
              <AccountField
                id="account-username"
                label="Username"
                value={username}
                error={profileErrors.username}
                autoComplete="username"
                onChange={setUsername}
              />
              <AccountField
                id="account-name"
                label="Name"
                value={userName}
                error={profileErrors.userName}
                autoComplete="name"
                onChange={setUserName}
              />
              <Field data-disabled>
                <FieldLabel htmlFor="account-email">Email</FieldLabel>
                <Input id="account-email" value={user.email} disabled />
                <FieldDescription>Email is managed from Users Profiles.</FieldDescription>
              </Field>
            </FieldGroup>
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" disabled={isSavingProfile}>
              {isSavingProfile ? <Spinner data-icon="inline-start" /> : <Save data-icon="inline-start" />}
              {isSavingProfile ? "Saving..." : "Save details"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound />
            Password
          </CardTitle>
          <CardDescription>Confirm your current password before choosing a new one.</CardDescription>
        </CardHeader>
        <form noValidate onSubmit={savePassword}>
          <CardContent>
            <FieldGroup>
              <AccountField
                id="account-current-password"
                label="Current password"
                type="password"
                value={currentPassword}
                error={passwordErrors.currentPassword}
                autoComplete="current-password"
                onChange={setCurrentPassword}
              />
              <AccountField
                id="account-new-password"
                label="New password"
                type="password"
                value={newPassword}
                error={passwordErrors.newPassword}
                autoComplete="new-password"
                description="Use between 8 and 128 characters."
                onChange={setNewPassword}
              />
              <AccountField
                id="account-confirm-password"
                label="Confirm new password"
                type="password"
                value={confirmPassword}
                error={passwordErrors.confirmPassword}
                autoComplete="new-password"
                onChange={setConfirmPassword}
              />
            </FieldGroup>
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="submit" disabled={isSavingPassword}>
              {isSavingPassword ? <Spinner data-icon="inline-start" /> : <KeyRound data-icon="inline-start" />}
              {isSavingPassword ? "Updating..." : "Change password"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

function PageHeading() {
  return (
    <div>
      <h1 className="text-3xl tracking-tight">Profile Page</h1>
      <p className="text-muted-foreground text-sm">Manage your profile details, login username and password.</p>
    </div>
  );
}

function AccountField({
  id,
  label,
  value,
  error,
  description,
  type = "text",
  autoComplete,
  onChange,
}: {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly error?: string;
  readonly description?: string;
  readonly type?: React.ComponentProps<typeof Input>["type"];
  readonly autoComplete?: React.ComponentProps<typeof Input>["autoComplete"];
  readonly onChange: (value: string) => void;
}) {
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? <FieldError>{error}</FieldError> : null}
      {description && !error ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
  );
}
