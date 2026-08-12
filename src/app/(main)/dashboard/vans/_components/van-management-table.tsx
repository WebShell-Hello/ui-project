"use client";

import * as React from "react";

import {
  CalendarClock,
  CarFront,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  MoreHorizontal,
  RotateCcw,
  Search,
  Trash2,
  UserRoundX,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  type OwnershipType,
  type VanRecord,
  type VanStatus,
  vanTestData,
} from "./van-data";
import { ExpiryBadge, formatVanDate, getExpiryState } from "./van-expiry";
import { VanProfileDialog } from "./van-profile-dialog";

type StatusFilter = "all" | VanStatus;
type OwnershipFilter = "all" | OwnershipType;
type VanView = "active" | "deleted";
interface PendingDeletion {
  readonly ids: string[];
  readonly permanent: boolean;
}

const statusLabels: Record<VanStatus, string> = {
  active: "Active",
  available: "Available",
  maintenance: "Maintenance",
  off_road: "Off road",
  returned: "Returned",
};

export function VanManagementTable() {
  const [vans, setVans] = React.useState(vanTestData);
  const [view, setView] = React.useState<VanView>("active");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [ownershipFilter, setOwnershipFilter] = React.useState<OwnershipFilter>("all");
  const [pageSize, setPageSize] = React.useState(10);
  const [pageIndex, setPageIndex] = React.useState(0);
  const [selectedVan, setSelectedVan] = React.useState<VanRecord | null>(null);
  const [selectedVanIds, setSelectedVanIds] = React.useState<Set<string>>(
    () => new Set<string>(),
  );
  const [pendingDeletion, setPendingDeletion] = React.useState<PendingDeletion | null>(null);

  const filteredVans = React.useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return vans.filter((van) => {
      const matchesView = view === "active" ? !van.archivedAt : Boolean(van.archivedAt);
      const matchesSearch =
        !normalizedQuery ||
        [
          van.id,
          van.registrationNumber,
          van.make,
          van.model,
          van.currentAssigneeName ?? "",
          van.depot,
        ].some((value) => value.toLowerCase().includes(normalizedQuery));
      const matchesStatus = statusFilter === "all" || van.status === statusFilter;
      const matchesOwnership = ownershipFilter === "all" || van.ownershipType === ownershipFilter;

      return matchesView && matchesSearch && matchesStatus && matchesOwnership;
    });
  }, [ownershipFilter, searchQuery, statusFilter, vans, view]);

  const activeVans = vans.filter((van) => !van.archivedAt);
  const deletedVansCount = vans.length - activeVans.length;
  const totalPages = Math.max(1, Math.ceil(filteredVans.length / pageSize));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);
  const visibleVans = filteredVans.slice(safePageIndex * pageSize, (safePageIndex + 1) * pageSize);
  const visibleVanIds = visibleVans.map((van) => van.id);
  const selectedCount = selectedVanIds.size;
  const selectedVisibleCount = visibleVanIds.filter((id) => selectedVanIds.has(id)).length;
  const allVisibleSelected = visibleVanIds.length > 0 && selectedVisibleCount === visibleVanIds.length;
  const expiryAttentionCount = activeVans.filter((van) =>
    [van.motExpiryDate, van.roadTaxExpiryDate, van.rentalTerminationDate].some((value) => {
      const state = getExpiryState(value);
      return state === "expired" || state === "expiring_soon";
    }),
  ).length;

  function resetPage() {
    setPageIndex(0);
  }

  function updatePageSize(value: string) {
    const nextPageSize = Number(value);

    if (Number.isInteger(nextPageSize) && nextPageSize >= 1 && nextPageSize <= 100) {
      setPageSize(nextPageSize);
      setPageIndex(0);
    }
  }

  function toggleVanSelection(id: string, selected: boolean) {
    setSelectedVanIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (selected) nextIds.add(id);
      else nextIds.delete(id);

      return nextIds;
    });
  }

  function toggleVisibleSelection(selected: boolean) {
    setSelectedVanIds((currentIds) => {
      const nextIds = new Set(currentIds);

      for (const id of visibleVanIds) {
        if (selected) nextIds.add(id);
        else nextIds.delete(id);
      }

      return nextIds;
    });
  }

  function restoreVans(ids: readonly string[]) {
    const restoredIds = new Set(ids);
    setVans((currentVans) =>
      currentVans.map((candidate) =>
        restoredIds.has(candidate.id)
          ? { ...candidate, archivedAt: null, archivedBy: null, updatedAt: new Date().toISOString() }
          : candidate,
      ),
    );
    setSelectedVanIds((currentIds) => {
      const nextIds = new Set(currentIds);
      for (const id of ids) nextIds.delete(id);
      return nextIds;
    });
    toast.success(ids.length === 1 ? "The van was restored." : `${ids.length} vans were restored.`);
    setPageIndex(0);
  }

  function deleteVans() {
    if (!pendingDeletion) return;

    const deletionIds = new Set(pendingDeletion.ids);

    if (pendingDeletion.permanent) {
      setVans((currentVans) => currentVans.filter((van) => !deletionIds.has(van.id)));
      toast.success(
        pendingDeletion.ids.length === 1
          ? "The van was permanently deleted."
          : `${pendingDeletion.ids.length} vans were permanently deleted.`,
      );
    } else {
      const timestamp = new Date().toISOString();

      setVans((currentVans) =>
        currentVans.map((van) =>
          deletionIds.has(van.id)
            ? {
                ...van,
                archivedAt: timestamp,
                archivedBy: "Current user",
                updatedAt: timestamp,
                updatedBy: "Current user",
              }
            : van,
        ),
      );
      toast.success(
        pendingDeletion.ids.length === 1
          ? "The van was moved to Deleted."
          : `${pendingDeletion.ids.length} vans were moved to Deleted.`,
      );
    }

    setSelectedVanIds((currentIds) => {
      const nextIds = new Set(currentIds);
      for (const id of pendingDeletion.ids) nextIds.delete(id);
      return nextIds;
    });
    setPendingDeletion(null);
    setPageIndex(0);
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="text-3xl tracking-tight">Vans management</h1>
        <p className="text-muted-foreground text-sm">
          Track vehicle assignments, ownership, compliance dates and supporting documents.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Fleet total"
          value={activeVans.length}
          description="Active vehicle records"
          icon={CarFront}
        />
        <SummaryCard
          label="Rented vans"
          value={activeVans.filter((van) => van.ownershipType === "rented").length}
          description="With rental agreements"
          icon={FileText}
        />
        <SummaryCard
          label="Expiry attention"
          value={expiryAttentionCount}
          description="Expired or due within 30 days"
          icon={CalendarClock}
        />
        <SummaryCard
          label="Unassigned"
          value={activeVans.filter((van) => !van.currentAssigneeId && van.status !== "returned").length}
          description="No current driver"
          icon={UserRoundX}
        />
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Fleet vehicles</CardTitle>
          <CardDescription>
            {filteredVans.length} {view === "active" ? "active" : "deleted"} vehicles
          </CardDescription>
          <div className="col-span-full mt-2 flex flex-col gap-2 lg:flex-row">
            <Tabs
              value={view}
              onValueChange={(value) => {
                setView(value as VanView);
                setSelectedVanIds(new Set<string>());
                resetPage();
              }}
            >
              <TabsList>
                <TabsTrigger value="active">Active ({activeVans.length})</TabsTrigger>
                <TabsTrigger value="deleted">Deleted ({deletedVansCount})</TabsTrigger>
              </TabsList>
            </Tabs>
            <InputGroup className="lg:max-w-sm">
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                value={searchQuery}
                placeholder="Search registration, driver or depot..."
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setSelectedVanIds(new Set<string>());
                  resetPage();
                }}
              />
            </InputGroup>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as StatusFilter);
                setSelectedVanIds(new Set<string>());
                resetPage();
              }}
            >
              <SelectTrigger className="w-full lg:w-44" aria-label="Vehicle status filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="off_road">Off road</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select
              value={ownershipFilter}
              onValueChange={(value) => {
                setOwnershipFilter(value as OwnershipFilter);
                setSelectedVanIds(new Set<string>());
                resetPage();
              }}
            >
              <SelectTrigger className="w-full lg:w-48" aria-label="Vehicle ownership filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All ownership</SelectItem>
                  <SelectItem value="company_owned">Company owned</SelectItem>
                  <SelectItem value="rented">Rented</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          {selectedCount > 0 ? (
            <div className="col-span-full flex flex-col gap-2 rounded-lg bg-muted p-2 sm:flex-row sm:items-center">
              <p className="flex-1 px-1 text-sm font-medium">{selectedCount} selected</p>
              {view === "deleted" ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => restoreVans([...selectedVanIds])}
                >
                  <RotateCcw data-icon="inline-start" />
                  Restore selected
                </Button>
              ) : null}
              <Button
                type="button"
                variant="destructive"
                onClick={() =>
                  setPendingDeletion({ ids: [...selectedVanIds], permanent: view === "deleted" })
                }
              >
                <Trash2 data-icon="inline-start" />
                {view === "deleted" ? "Delete permanently" : "Delete selected"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setSelectedVanIds(new Set<string>())}
              >
                Clear selection
              </Button>
            </div>
          ) : null}
        </CardHeader>
        <CardContent className="flex flex-col gap-4 px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        allVisibleSelected
                          ? true
                          : selectedVisibleCount > 0
                            ? "indeterminate"
                            : false
                      }
                      aria-label="Select all vans on this page"
                      onCheckedChange={(checked) => toggleVisibleSelection(checked === true)}
                    />
                  </TableHead>
                  <TableHead>Van</TableHead>
                  <TableHead>Assigned to</TableHead>
                  <TableHead>Ownership</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>MOT</TableHead>
                  <TableHead>Road tax</TableHead>
                  <TableHead>Rental termination</TableHead>
                  <TableHead className="text-center">Documents</TableHead>
                  <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleVans.length > 0 ? (
                  visibleVans.map((van) => (
                    <TableRow
                      key={van.id}
                      data-state={selectedVanIds.has(van.id) ? "selected" : undefined}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedVanIds.has(van.id)}
                          aria-label={`Select ${van.registrationNumber}`}
                          onCheckedChange={(checked) => toggleVanSelection(van.id, checked === true)}
                        />
                      </TableCell>
                      <TableCell>
                        <button type="button" className="flex flex-col text-left" onClick={() => setSelectedVan(van)}>
                          <span className="font-medium">{van.registrationNumber}</span>
                          <span className="text-muted-foreground text-xs">{van.make} {van.model} · {van.id}</span>
                        </button>
                      </TableCell>
                      <TableCell>
                        {van.currentAssigneeName ? (
                          <div className="flex flex-col">
                            <span>{van.currentAssigneeName}</span>
                            <span className="text-muted-foreground text-xs">{van.currentAssigneeId}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {van.ownershipType === "company_owned" ? "Company owned" : "Rented"}
                        </Badge>
                      </TableCell>
                      <TableCell><Badge variant="secondary">{statusLabels[van.status]}</Badge></TableCell>
                      <ExpiryCell value={van.motExpiryDate} />
                      <ExpiryCell value={van.roadTaxExpiryDate} />
                      <TableCell>
                        {van.ownershipType === "rented" ? (
                          <div className="flex flex-col gap-1">
                            <span>{formatVanDate(van.rentalTerminationDate)}</span>
                            <ExpiryBadge value={van.rentalTerminationDate} />
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Not applicable</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">{van.documentCount}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${van.registrationNumber}`}>
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuGroup>
                              <DropdownMenuItem onSelect={() => setSelectedVan(van)}>
                                <Eye />
                                View van profile
                              </DropdownMenuItem>
                              {view === "deleted" ? (
                                <DropdownMenuItem onSelect={() => restoreVans([van.id])}>
                                  <RotateCcw />
                                  Restore van
                                </DropdownMenuItem>
                              ) : null}
                              <DropdownMenuItem
                                variant="destructive"
                                onSelect={() =>
                                  setPendingDeletion({ ids: [van.id], permanent: view === "deleted" })
                                }
                              >
                                <Trash2 />
                                {view === "deleted" ? "Delete permanently" : "Delete van"}
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                      No vans match the selected filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-col gap-3 px-4 pb-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground text-sm">
              Viewing {visibleVans.length} out of {filteredVans.length}{" "}
              {view === "deleted" ? "deleted " : ""}vans
              {selectedCount > 0 ? ` · ${selectedCount} selected` : ""}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <label className="text-muted-foreground text-sm" htmlFor="vans-page-size">
                Rows per page
              </label>
              <Input
                id="vans-page-size"
                className="h-8 w-16 text-center"
                type="number"
                min="1"
                max="100"
                value={pageSize}
                onChange={(event) => updatePageSize(event.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={safePageIndex === 0}
                onClick={() => setPageIndex((current) => current - 1)}
              >
                <ChevronLeft />
                Previous
              </Button>
              <span className="flex size-8 items-center justify-center rounded-md bg-muted text-sm">
                {safePageIndex + 1}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={safePageIndex >= totalPages - 1}
                onClick={() => setPageIndex((current) => current + 1)}
              >
                Next
                <ChevronRight />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <VanProfileDialog van={selectedVan} onOpenChange={(open) => !open && setSelectedVan(null)} />

      <AlertDialog
        open={Boolean(pendingDeletion)}
        onOpenChange={(open) => {
          if (!open) setPendingDeletion(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingDeletion?.permanent
                ? `Permanently delete ${pendingDeletion.ids.length} selected ${
                    pendingDeletion.ids.length === 1 ? "van" : "vans"
                  }?`
                : `Delete ${pendingDeletion?.ids.length ?? 0} selected ${
                    pendingDeletion?.ids.length === 1 ? "van" : "vans"
                  }?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDeletion?.permanent
                ? "The selected vehicles will be permanently removed from this test session. This cannot be undone."
                : "The selected vehicles will move to Deleted and can be restored later."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={deleteVans}>
              <Trash2 data-icon="inline-start" />
              {pendingDeletion?.permanent ? "Delete permanently" : "Delete selected"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  readonly label: string;
  readonly value: number;
  readonly description: string;
  readonly icon: React.ComponentType;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription className="flex items-center gap-2"><Icon />{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent><p className="text-muted-foreground text-xs">{description}</p></CardContent>
    </Card>
  );
}

function ExpiryCell({ value }: { readonly value: string | null }) {
  return (
    <TableCell>
      <div className="flex flex-col gap-1">
        <span>{formatVanDate(value)}</span>
        <ExpiryBadge value={value} />
      </div>
    </TableCell>
  );
}
