import { Badge } from "@/components/ui/badge";

export type ExpiryState = "valid" | "expiring_soon" | "expired" | "not_provided";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function getExpiryState(value: string | null): ExpiryState {
  if (!value) return "not_provided";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiryDate = new Date(`${value}T00:00:00`);
  const daysRemaining = Math.ceil((expiryDate.getTime() - today.getTime()) / 86_400_000);

  if (daysRemaining < 0) return "expired";
  if (daysRemaining <= 30) return "expiring_soon";
  return "valid";
}

export function formatVanDate(value: string | null) {
  return value ? dateFormatter.format(new Date(`${value}T00:00:00`)) : "Not provided";
}

export function ExpiryBadge({ value }: { readonly value: string | null }) {
  const state = getExpiryState(value);

  if (state === "not_provided") return <Badge variant="outline">Not provided</Badge>;
  if (state === "expired") return <Badge variant="destructive">Expired</Badge>;
  if (state === "expiring_soon") return <Badge variant="secondary">Expiring soon</Badge>;
  return <Badge variant="outline">Valid</Badge>;
}
