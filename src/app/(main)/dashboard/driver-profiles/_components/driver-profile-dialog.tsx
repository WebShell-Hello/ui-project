"use client";

import * as React from "react";

import { format, parse } from "date-fns";
import { enGB } from "date-fns/locale";
import {
  BriefcaseBusiness,
  CalendarIcon,
  CarFront,
  Contact,
  FileCheck2,
  History,
  MapPinned,
  ShieldUser,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";

import {
  complianceStatuses,
  type DriverRecord,
  driverStatuses,
  employmentTypes,
  getDriverDisplayName,
} from "./driver-data";

interface DriverProfileDialogProps {
  driver: DriverRecord | null;
  mode: "add" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (driver: DriverRecord) => Promise<boolean>;
}

interface FormSectionProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

function FormSection({ title, description, icon: Icon, children }: FormSectionProps) {
  return (
    <section className="rounded-xl border bg-background">
      <div className="flex items-start gap-3 border-b p-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="size-4" />
        </div>
        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="text-muted-foreground text-xs">{description}</p>
        </div>
      </div>
      <div className="grid gap-4 p-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function DriverField({
  label,
  id,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
  className,
}: {
  label: string;
  id: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: React.HTMLInputTypeAttribute;
  required?: boolean;
  placeholder?: string;
  className?: string;
}) {
  return (
    <Field className={className}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        type={type}
        value={value}
        required={required}
        placeholder={placeholder ?? `Enter ${label.toLowerCase()}`}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}

function DriverDatePicker({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const selectedDate = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined;

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            data-empty={!selectedDate}
            className="w-full justify-between text-left font-normal data-[empty=true]:text-muted-foreground"
          >
            {selectedDate ? format(selectedDate, "d MMM yyyy", { locale: enGB }) : "Select date"}
            <CalendarIcon className="text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
          <Calendar
            className="w-full"
            mode="single"
            locale={enGB}
            selected={selectedDate}
            defaultMonth={selectedDate}
            onSelect={(date) => {
              if (!date) {
                return;
              }

              onChange(format(date, "yyyy-MM-dd"));
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </Field>
  );
}

function formatAuditDate(value: string) {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function DriverProfileDialog({
  driver,
  mode,
  open,
  onOpenChange,
  onSave,
}: DriverProfileDialogProps) {
  const [draft, setDraft] = React.useState<DriverRecord | null>(driver);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    setDraft(driver);
  }, [driver]);

  if (!draft) {
    return null;
  }

  function update<K extends keyof DriverRecord>(field: K, value: DriverRecord[K]) {
    setDraft((current) => (current ? { ...current, [field]: value } : current));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.firstName.trim() || !draft.lastName.trim() || !draft.phone.trim() || !draft.email.trim()) {
      toast.error("Please complete the first name, last name, phone and email fields.");
      return;
    }

    setIsSaving(true);

    try {
      const saved = await onSave({
        ...draft,
        updatedAt: new Date().toISOString(),
        updatedBy: "Current user",
      });

      if (saved) {
        onOpenChange(false);
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-hidden p-0 sm:max-w-5xl">
        <DialogHeader className="border-b px-5 pt-5 pb-4">
          <DialogTitle>{mode === "add" ? "Add driver" : `Edit ${getDriverDisplayName(draft)}`}</DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Create a complete driver record. Required identity fields are marked by the browser."
              : `${draft.id} · Review and update the driver's complete profile.`}
          </DialogDescription>
        </DialogHeader>

        <form className="flex min-h-0 flex-col" noValidate onSubmit={handleSubmit}>
          <div className="grid max-h-[calc(92vh-9.5rem)] gap-4 overflow-y-auto bg-muted/20 p-4 lg:grid-cols-2">
            <FormSection title="1. Personal" description="Identity and contact details." icon={UserRound}>
              <DriverField
                label="First name"
                id="driver-first-name"
                value={draft.firstName}
                required
                onChange={(value) => update("firstName", value)}
              />
              <DriverField
                label="Last name"
                id="driver-last-name"
                value={draft.lastName}
                required
                onChange={(value) => update("lastName", value)}
              />
              <DriverField
                label="Preferred name"
                id="driver-preferred-name"
                value={draft.preferredName}
                onChange={(value) => update("preferredName", value)}
              />
              <DriverDatePicker
                label="Date of birth"
                id="driver-date-of-birth"
                value={draft.dateOfBirth}
                onChange={(value) => update("dateOfBirth", value)}
              />
              <DriverField
                label="Phone"
                id="driver-phone"
                type="tel"
                value={draft.phone}
                required
                onChange={(value) => update("phone", value)}
              />
              <DriverField
                label="Email"
                id="driver-email"
                type="email"
                value={draft.email}
                required
                onChange={(value) => update("email", value)}
              />
              <DriverField
                label="Address"
                id="driver-address"
                value={draft.address}
                className="sm:col-span-2"
                onChange={(value) => update("address", value)}
              />
              <DriverField
                label="Postcode"
                id="driver-postcode"
                value={draft.postcode}
                onChange={(value) => update("postcode", value)}
              />
            </FormSection>

            <FormSection title="2. Employment" description="Role, status and reporting structure." icon={BriefcaseBusiness}>
              <Field>
                <FieldLabel htmlFor="driver-employment-type">Employment type</FieldLabel>
                <NativeSelect
                  id="driver-employment-type"
                  className="w-full"
                  value={draft.employmentType}
                  onChange={(event) => update("employmentType", event.target.value as DriverRecord["employmentType"])}
                >
                  {employmentTypes.map((value) => (
                    <NativeSelectOption key={value} value={value}>
                      {value === "agency" ? "Agency" : `${value.charAt(0).toUpperCase()}${value.slice(1)}`}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel htmlFor="driver-status">Driver status</FieldLabel>
                <NativeSelect
                  id="driver-status"
                  className="w-full"
                  value={draft.status}
                  onChange={(event) => update("status", event.target.value as DriverRecord["status"])}
                >
                  {driverStatuses.map((value) => (
                    <NativeSelectOption key={value} value={value}>
                      {value === "on_leave" ? "On leave" : `${value.charAt(0).toUpperCase()}${value.slice(1)}`}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
              <DriverField label="Job title" id="driver-job-title" value={draft.jobTitle} onChange={(value) => update("jobTitle", value)} />
              <DriverField label="Depot / Team" id="driver-depot" value={draft.depot} onChange={(value) => update("depot", value)} />
              <DriverField label="Manager" id="driver-manager" value={draft.manager} onChange={(value) => update("manager", value)} />
              <DriverDatePicker label="Start date" id="driver-start-date" value={draft.startDate} onChange={(value) => update("startDate", value)} />
              <DriverDatePicker label="End date" id="driver-end-date" value={draft.endDate} onChange={(value) => update("endDate", value)} />
            </FormSection>

            <FormSection title="3. Licence" description="Driving entitlement and endorsements." icon={Contact}>
              <DriverField label="Licence number" id="driver-licence-number" value={draft.licenceNumber} onChange={(value) => update("licenceNumber", value)} />
              <DriverField label="Categories" id="driver-licence-categories" value={draft.licenceCategories} onChange={(value) => update("licenceCategories", value)} />
              <DriverDatePicker label="Expiry date" id="driver-licence-expiry" value={draft.licenceExpiry} onChange={(value) => update("licenceExpiry", value)} />
              <DriverField
                label="Penalty points"
                id="driver-licence-points"
                type="number"
                value={draft.licencePoints}
                onChange={(value) => update("licencePoints", Number(value))}
              />
            </FormSection>

            <FormSection title="4. Vehicle Assignment" description="Current vehicle allocation." icon={CarFront}>
              <DriverField label="Vehicle ID" id="driver-vehicle-id" value={draft.vehicleId} onChange={(value) => update("vehicleId", value)} />
              <DriverField label="Registration" id="driver-vehicle-registration" value={draft.vehicleRegistration} onChange={(value) => update("vehicleRegistration", value)} />
              <DriverDatePicker label="Assigned date" id="driver-vehicle-date" value={draft.vehicleAssignedDate} onChange={(value) => update("vehicleAssignedDate", value)} />
            </FormSection>

            <FormSection title="5. Compliance Documents" description="Document validity and overall compliance." icon={FileCheck2}>
              <Field>
                <FieldLabel htmlFor="driver-compliance-status">Compliance status</FieldLabel>
                <NativeSelect
                  id="driver-compliance-status"
                  className="w-full"
                  value={draft.complianceStatus}
                  onChange={(event) => update("complianceStatus", event.target.value as DriverRecord["complianceStatus"])}
                >
                  {complianceStatuses.map((value) => (
                    <NativeSelectOption key={value} value={value}>
                      {value.split("_").map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`).join(" ")}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
              <DriverDatePicker label="Right to work expiry" id="driver-right-to-work" value={draft.rightToWorkExpiry} onChange={(value) => update("rightToWorkExpiry", value)} />
              <DriverDatePicker label="DBS expiry" id="driver-dbs-expiry" value={draft.dbsExpiry} onChange={(value) => update("dbsExpiry", value)} />
              <DriverDatePicker label="Medical expiry" id="driver-medical-expiry" value={draft.medicalExpiry} onChange={(value) => update("medicalExpiry", value)} />
            </FormSection>

            <FormSection title="6. Emergency Contact" description="Primary contact for an emergency." icon={ShieldUser}>
              <DriverField label="Contact name" id="driver-emergency-name" value={draft.emergencyContactName} onChange={(value) => update("emergencyContactName", value)} />
              <DriverField label="Relationship" id="driver-emergency-relationship" value={draft.emergencyContactRelationship} onChange={(value) => update("emergencyContactRelationship", value)} />
              <DriverField label="Contact phone" id="driver-emergency-phone" type="tel" value={draft.emergencyContactPhone} onChange={(value) => update("emergencyContactPhone", value)} />
            </FormSection>

            <FormSection title="7. Operations" description="Day-to-day assignment and payroll references." icon={MapPinned}>
              <DriverField label="Usual route" id="driver-usual-route" value={draft.usualRoute} onChange={(value) => update("usualRoute", value)} />
              <DriverField label="Shift pattern" id="driver-shift-pattern" value={draft.shiftPattern} onChange={(value) => update("shiftPattern", value)} />
              <DriverField label="Payroll reference" id="driver-payroll-reference" value={draft.payrollReference} onChange={(value) => update("payrollReference", value)} />
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="driver-notes">Notes</FieldLabel>
                <Textarea id="driver-notes" value={draft.notes} onChange={(event) => update("notes", event.target.value)} />
              </Field>
            </FormSection>

            <FormSection title="8. Audit" description="Read-only record history." icon={History}>
              <div>
                <p className="text-muted-foreground text-xs">Created</p>
                <p className="font-medium">{formatAuditDate(draft.createdAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Created by</p>
                <p className="font-medium">{draft.createdBy}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Last updated</p>
                <p className="font-medium">{formatAuditDate(draft.updatedAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Updated by</p>
                <p className="font-medium">{draft.updatedBy}</p>
              </div>
            </FormSection>
          </div>

          <DialogFooter className="m-0 shrink-0 px-5">
            <Button type="button" variant="outline" disabled={isSaving} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : mode === "add" ? "Add driver" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
