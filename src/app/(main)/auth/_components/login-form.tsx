"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { AUTH_MODES } from "@/lib/auth/auth.types";

const formSchema = z.object({
  authMode: z.enum(AUTH_MODES),
  username: z.string().trim().min(1, {
    message: "Please enter your username.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  remember: z.boolean().optional(),
});

interface AuthenticatedUser {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  role: string;
}

interface LoginResponse {
  message?: string;
  user?: AuthenticatedUser;
  role?: string;
  redirectTo?: string;
}

export function LoginForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      authMode: "api",
      username: "",
      password: "",
      remember: false,
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    form.clearErrors("root");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: data.username,
          password: data.password,
          authMode: data.authMode,
          remember: data.remember,
        }),
      });

      const result = (await response.json()) as LoginResponse;

      if (!response.ok || !result.user) {
        form.setError("root", {
          message:
            result.message ??
            "Unable to sign in. Please try again.",
        });
        return;
      }

      if (!result.redirectTo) {
        form.setError("root", {
          message:
            "No redirect route is configured for this role.",
        });
        return;
      }

      toast.success(
        `Welcome back, ${result.user.displayName}`,
        {
          description: `${result.user.username} · ${result.user.role}`,
        },
      );

      window.location.replace(result.redirectTo);
    } catch {
      form.setError("root", {
        message:
          "Unable to reach the login service. Please try again.",
      });
    }
  }

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
    >
      <FieldGroup className="gap-4">
        <Controller
          control={form.control}
          name="username"
          render={({ field, fieldState }) => (
            <Field
              className="gap-1.5"
              data-invalid={fieldState.invalid}
            >
              <FieldLabel htmlFor="login-username">
                Username
              </FieldLabel>

              <Input
                {...field}
                id="login-username"
                type="text"
                placeholder="Enter your username"
                autoComplete="username"
                aria-invalid={fieldState.invalid}
              />

              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <Field
              className="gap-1.5"
              data-invalid={fieldState.invalid}
            >
              <FieldLabel htmlFor="login-password">
                Password
              </FieldLabel>

              <Input
                {...field}
                id="login-password"
                type="password"
                // placeholder="••••••••"
                placeholder="Enter your password"
                autoComplete="current-password"
                aria-invalid={fieldState.invalid}
              />

              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="remember"
          render={({ field, fieldState }) => (
            <Field
              orientation="horizontal"
              data-invalid={fieldState.invalid}
            >
              <Checkbox
                id="login-remember"
                name={field.name}
                checked={field.value}
                onCheckedChange={(checked) =>
                  field.onChange(Boolean(checked))
                }
                aria-invalid={fieldState.invalid}
              />

              <FieldContent>
                <FieldLabel
                  htmlFor="login-remember"
                  className="font-normal"
                >
                  Remember me for 7 days
                </FieldLabel>

                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </FieldContent>
            </Field>
          )}
        />
      </FieldGroup>

      {form.formState.errors.root?.message && (
        <p className="text-destructive text-sm" role="alert">
          {form.formState.errors.root.message}
        </p>
      )}

      <Button
        className="w-full"
        disabled={form.formState.isSubmitting}
        type="submit"
      >
        {form.formState.isSubmitting
          ? "Signing in..."
          : "Login"}
      </Button>
      <p className="text-center text-muted-foreground text-xs">
      Don&apos;t have an account?{" "}
        <Link
          prefetch={false}
          href="/auth/v1/register"
          className="text-primary"
        >
          Register
        </Link>
      </p>

    <fieldset className="space-y-2 border-t pt-4">
      <legend className="font-medium text-sm">
        Authentication Mode
      </legend>

      <Controller
        control={form.control}
        name="authMode"
        render={({ field }) => (
          <RadioGroup
            value={field.value}
            onValueChange={(value) => {
              field.onChange(value);
              form.clearErrors("root");
            }}
            className="grid gap-2 sm:grid-cols-2"
          >
            <label
              htmlFor="auth-mode-api"
              className="flex cursor-pointer items-start gap-3 rounded-lg border p-3"
            >
              <RadioGroupItem
                id="auth-mode-api"
                value="api"
                className="mt-0.5"
              />

              <span className="space-y-1">
                <span className="block font-medium text-sm">
                  Live API
                </span>
                <span className="block text-muted-foreground text-xs">
                  Authenticate with API.
                </span>
              </span>
            </label>

            <label
              htmlFor="auth-mode-mock"
              className="flex cursor-pointer items-start gap-3 rounded-lg border p-3"
            >
              <RadioGroupItem
                id="auth-mode-mock"
                value="mock"
                className="mt-0.5"
              />

              <span className="space-y-1">
                <span className="block font-medium text-sm">
                  Local Test
                </span>
                <span className="block text-muted-foreground text-xs">
                  Use offline test accounts.
                </span>
              </span>
            </label>
          </RadioGroup>
        )}
      />
    </fieldset>
    </form>
  );
}
