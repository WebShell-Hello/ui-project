"use client";

import type * as React from "react";

import { Building2, CalendarClock, CarFront, FileText, Gauge, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { VanRecord } from "./van-data";
import { ExpiryBadge, formatVanDate } from "./van-expiry";

const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});
const numberFormatter = new Intl.NumberFormat("en-GB");

export function VanProfileDialog({
  van,
  onOpenChange,
}: {
  readonly van: VanRecord | null;
  readonly onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={Boolean(van)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        {van ? (
          <>
            <DialogHeader>
              <DialogTitle>{van.registrationNumber} · Van profile</DialogTitle>
              <DialogDescription>{van.make} {van.model} · {van.id}</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 md:grid-cols-2">
              <ProfileSection title="Vehicle details" description="Identity and operating details" icon={CarFront}>
                <ProfileField label="VIN" value={van.vin} />
                <ProfileField label="Year / colour" value={`${van.manufactureYear} · ${van.colour}`} />
                <ProfileField
                  label="Fuel / transmission"
                  value={`${titleCase(van.fuelType)} · ${titleCase(van.transmission)}`}
                />
                <ProfileField label="Mileage" value={`${numberFormatter.format(van.mileage)} miles`} icon={Gauge} />
                <ProfileField label="Depot" value={van.depot} />
                <ProfileField label="Status" value={titleCase(van.status)} />
              </ProfileSection>

              <ProfileSection title="Driver assignment" description="Current vehicle allocation" icon={UserRound}>
                <ProfileField label="Assigned to" value={van.currentAssigneeName ?? "Unassigned"} />
                <ProfileField label="Driver ID" value={van.currentAssigneeId ?? "Not applicable"} />
                <ProfileField label="Assigned date" value={formatVanDate(van.assignmentStartDate)} />
                <ProfileField label="Expected end" value={formatVanDate(van.assignmentExpectedEndDate)} />
              </ProfileSection>

              <ProfileSection title="Ownership" description="Company or rental details" icon={Building2}>
                <ProfileField
                  label="Ownership type"
                  value={van.ownershipType === "company_owned" ? "Company owned" : "Rented"}
                />
                <ProfileField label="Owner / supplier" value={van.ownerName} />
                {van.ownershipType === "rented" ? (
                  <>
                    <ProfileField label="Contract" value={van.rentalContractNumber ?? "Not provided"} />
                    <ProfileField label="Rental start" value={formatVanDate(van.rentalStartDate)} />
                    <ProfileField label="Termination" value={formatVanDate(van.rentalTerminationDate)} />
                    <ProfileField
                      label="Monthly cost"
                      value={van.rentalMonthlyCost ? currencyFormatter.format(van.rentalMonthlyCost) : "Not provided"}
                    />
                  </>
                ) : (
                  <>
                    <ProfileField label="Purchase date" value={formatVanDate(van.purchaseDate)} />
                    <ProfileField
                      label="Purchase price"
                      value={van.purchasePrice ? currencyFormatter.format(van.purchasePrice) : "Not provided"}
                    />
                  </>
                )}
              </ProfileSection>

              <ProfileSection title="Compliance & expiry" description="Vehicle renewal dates" icon={CalendarClock}>
                <ComplianceField label="MOT" value={van.motExpiryDate} />
                <ComplianceField label="Road tax" value={van.roadTaxExpiryDate} />
                <ComplianceField label="Insurance" value={van.insuranceExpiryDate} />
                <ProfileField label="Service due" value={formatVanDate(van.serviceDueDate)} />
                <ProfileField
                  label="Service mileage"
                  value={
                    van.serviceDueMileage
                      ? `${numberFormatter.format(van.serviceDueMileage)} miles`
                      : "Not provided"
                  }
                />
                <ProfileField label="Next inspection" value={formatVanDate(van.nextInspectionDate)} />
              </ProfileSection>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><FileText />Documents</CardTitle>
                  <CardDescription>Documents linked to this vehicle</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">{van.documentCount} vehicle documents</p>
                      <p className="text-muted-foreground text-sm">
                        MOT, road tax, insurance, rental and service files will be managed here.
                      </p>
                    </div>
                    <Badge variant="outline">Mock data</Badge>
                  </div>
                  {van.notes ? <p className="text-muted-foreground text-sm">Notes: {van.notes}</p> : null}
                </CardContent>
              </Card>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ProfileSection({
  title,
  description,
  icon: Icon,
  children,
}: {
  readonly title: string;
  readonly description: string;
  readonly icon: React.ComponentType;
  readonly children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Icon />{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">{children}</CardContent>
    </Card>
  );
}

function ProfileField({
  label,
  value,
  icon: Icon,
}: {
  readonly label: string;
  readonly value: string;
  readonly icon?: React.ComponentType;
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1 text-muted-foreground text-xs">{Icon ? <Icon /> : null}{label}</p>
      <p className="truncate font-medium">{value}</p>
    </div>
  );
}

function ComplianceField({ label, value }: { readonly label: string; readonly value: string | null }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-medium">{formatVanDate(value)}</p>
      <ExpiryBadge value={value} />
    </div>
  );
}

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
