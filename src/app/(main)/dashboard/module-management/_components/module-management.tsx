"use client";

import * as React from "react";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Braces,
  Database,
  Info,
  Menu,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  createModuleRecords,
  getModuleIcon,
  mergeModuleConfiguration,
  MODULE_MANAGEMENT_ID,
  type ModuleRecord,
  moduleGroups,
  moduleIconOptions,
  persistModuleConfiguration,
  readModuleConfiguration,
} from "@/navigation/sidebar/module-configuration";

const allGroupsValue = "all";
const allStatusesValue = "all";

type ModuleDialogMode = "add" | "edit";

interface ModuleFormErrors {
  title?: string;
  route?: string;
  pageFile?: string;
}

function normalizeModuleKey(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getNextOrder(modules: ModuleRecord[], group: string) {
  return modules.reduce(
    (largestOrder, module) =>
      module.group === group && !module.deleted
        ? Math.max(largestOrder, module.order)
        : largestOrder,
    0,
  ) + 1;
}

function sortModules(modules: ModuleRecord[]) {
  const groupOrder = new Map(moduleGroups.map((group, index) => [group, index]));

  return [...modules].sort((firstModule, secondModule) => {
    const firstGroupOrder = groupOrder.get(firstModule.group) ?? moduleGroups.length;
    const secondGroupOrder = groupOrder.get(secondModule.group) ?? moduleGroups.length;

    return firstGroupOrder - secondGroupOrder || firstModule.order - secondModule.order;
  });
}

interface ModuleManagementProps {
  initialModules: ModuleRecord[] | null;
}

export function ModuleManagement({ initialModules }: ModuleManagementProps) {
  const migrationAttempted = React.useRef(false);
  const defaultModules = React.useMemo(() => createModuleRecords(), []);
  const initialRecords = React.useMemo(
    () => mergeModuleConfiguration(defaultModules, initialModules),
    [defaultModules, initialModules],
  );
  const [modules, setModules] = React.useState<ModuleRecord[]>(initialRecords);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [groupFilter, setGroupFilter] = React.useState(allGroupsValue);
  const [statusFilter, setStatusFilter] = React.useState(allStatusesValue);
  const [dialogMode, setDialogMode] = React.useState<ModuleDialogMode>("edit");
  const [draft, setDraft] = React.useState<ModuleRecord | null>(null);
  const [formErrors, setFormErrors] = React.useState<ModuleFormErrors>({});
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [modulePendingDeletion, setModulePendingDeletion] = React.useState<ModuleRecord | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  React.useEffect(() => {
    if (initialModules) {
      setModules(initialRecords);
      return;
    }

    const localModules = readModuleConfiguration();
    const migratedModules = mergeModuleConfiguration(defaultModules, localModules);
    setModules(migratedModules);

    if (localModules && !migrationAttempted.current) {
      migrationAttempted.current = true;
      void persistModuleConfiguration(migratedModules).catch((error: unknown) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to migrate the browser module configuration to the local file.",
        );
      });
    }
  }, [defaultModules, initialModules, initialRecords]);

  const activeModules = React.useMemo(
    () => modules.filter((module) => !module.deleted),
    [modules],
  );
  const sortedModules = React.useMemo(() => sortModules(activeModules), [activeModules]);
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredModules = sortedModules.filter((module) => {
    const matchesSearch =
      !normalizedQuery ||
      [module.title, module.route, module.dataset, module.apiEndpoint, module.pageFile].some((value) =>
        value.toLowerCase().includes(normalizedQuery),
      );
    const matchesGroup = groupFilter === allGroupsValue || module.group === groupFilter;
    const matchesStatus =
      statusFilter === allStatusesValue ||
      (statusFilter === "enabled" ? module.enabled : !module.enabled);

    return matchesSearch && matchesGroup && matchesStatus;
  });
  const enabledCount = activeModules.filter((module) => module.enabled).length;
  const apiCount = activeModules.filter((module) => module.apiEndpoint.trim()).length;
  const customCount = activeModules.filter((module) => module.source === "custom").length;

  function updateModule(moduleId: string, update: Partial<ModuleRecord>) {
    const safeUpdate =
      moduleId === MODULE_MANAGEMENT_ID
        ? { ...update, enabled: true, deleted: false }
        : update;

    setModules((currentModules) =>
      currentModules.map((module) =>
        module.id === moduleId ? { ...module, ...safeUpdate } : module,
      ),
    );
  }

  function openAddDialog() {
    const defaultGroup = moduleGroups[0] ?? "Pages";

    setDialogMode("add");
    setFormErrors({});
    setDraft({
      id: `custom-${Date.now()}`,
      title: "",
      group: defaultGroup,
      route: "/dashboard/",
      enabled: true,
      order: getNextOrder(modules, defaultGroup),
      dataset: "",
      apiEndpoint: "",
      pageFile: "src/app/(main)/dashboard/",
      iconName: "panels-top-left",
      deleted: false,
      source: "custom",
    });
    setIsDialogOpen(true);
  }

  function openEditDialog(module: ModuleRecord) {
    setDialogMode("edit");
    setFormErrors({});
    setDraft({ ...module });
    setIsDialogOpen(true);
  }

  function updateDraft<K extends keyof ModuleRecord>(field: K, value: ModuleRecord[K]) {
    setDraft((currentDraft) =>
      currentDraft ? { ...currentDraft, [field]: value } : currentDraft,
    );
  }

  async function handleDialogSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft) {
      return;
    }

    const nextErrors: ModuleFormErrors = {};

    if (!draft.title.trim()) {
      nextErrors.title = "Enter a module name.";
    }

    if (!draft.route.startsWith("/")) {
      nextErrors.route = "Route must start with /.";
    }

    if (!draft.pageFile.endsWith("page.tsx")) {
      nextErrors.pageFile = "Bind the module to a page.tsx file.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }

    if (dialogMode === "add") {
      const moduleKey = normalizeModuleKey(draft.title);
      const nextModule = {
        ...draft,
        id: moduleKey ? `custom-${moduleKey}-${Date.now()}` : draft.id,
        order: getNextOrder(modules, draft.group),
      };
      const nextModules = [...modules, nextModule];

      setIsSaving(true);

      try {
        await persistModuleConfiguration(nextModules);
        setModules(nextModules);
        toast.success(`${nextModule.title} was added, saved to file and applied to the Sidebar.`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save the module configuration.");
        setIsSaving(false);
        return;
      }
    } else {
      const existingModule = modules.find((module) => module.id === draft.id);
      const nextDraft =
        existingModule && existingModule.group !== draft.group
          ? { ...draft, order: getNextOrder(modules, draft.group) }
          : draft;
      const safeNextDraft =
        nextDraft.id === MODULE_MANAGEMENT_ID
          ? { ...nextDraft, enabled: true, deleted: false }
          : nextDraft;
      const nextModules = modules.map((module) =>
        module.id === safeNextDraft.id ? safeNextDraft : module,
      );

      setIsSaving(true);

      try {
        await persistModuleConfiguration(nextModules);
        setModules(nextModules);
        toast.success(`${safeNextDraft.title} was saved to file and applied to the Sidebar.`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save the module configuration.");
        setIsSaving(false);
        return;
      }
    }

    setIsDialogOpen(false);
    setIsSaving(false);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const activeModule = modules.find((module) => module.id === String(active.id));
    const overModule = modules.find((module) => module.id === String(over.id));

    if (!activeModule || !overModule) {
      return;
    }

    if (activeModule.group !== overModule.group) {
      toast.info("Modules can only be reordered within the same Sidebar group.");
      return;
    }

    setModules((currentModules) => {
      const modulesInGroup = currentModules
        .filter((module) => module.group === activeModule.group && !module.deleted)
        .sort((firstModule, secondModule) => firstModule.order - secondModule.order);
      const activeIndex = modulesInGroup.findIndex((module) => module.id === activeModule.id);
      const overIndex = modulesInGroup.findIndex((module) => module.id === overModule.id);

      if (activeIndex === -1 || overIndex === -1) {
        return currentModules;
      }

      const reorderedModules = arrayMove(modulesInGroup, activeIndex, overIndex);
      const orderById = new Map(reorderedModules.map((module, index) => [module.id, index + 1]));

      return currentModules.map((module) =>
        module.group === activeModule.group
          ? { ...module, order: orderById.get(module.id) ?? module.order }
          : module,
      );
    });
  }

  function requestModuleDeletion(module: ModuleRecord) {
    if (module.id === MODULE_MANAGEMENT_ID) {
      return;
    }

    setIsDialogOpen(false);
    setModulePendingDeletion(module);
    setIsDeleteDialogOpen(true);
  }

  function confirmModuleDeletion() {
    if (!modulePendingDeletion || modulePendingDeletion.id === MODULE_MANAGEMENT_ID) {
      return;
    }

    updateModule(modulePendingDeletion.id, { deleted: true, enabled: false });
    toast.success(`${modulePendingDeletion.title} was marked for deletion. Save changes to apply it.`);
    setIsDeleteDialogOpen(false);
    setModulePendingDeletion(null);
  }

  function handleDeleteDialogOpenChange(open: boolean) {
    setIsDeleteDialogOpen(open);

    if (!open) {
      setModulePendingDeletion(null);
    }
  }

  async function saveConfiguration() {
    setIsSaving(true);

    try {
      await persistModuleConfiguration(modules);
      toast.success("Module configuration was saved to file and applied to the Sidebar.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save the module configuration.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl leading-none tracking-tight">Module Management</h1>
          <p className="text-muted-foreground text-sm">
            Configure Sidebar visibility, data connections, page bindings and display order.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={isSaving} onClick={saveConfiguration}>
            <Save data-icon="inline-start" />
            Save changes
          </Button>
          <Button type="button" disabled={isSaving} onClick={openAddDialog}>
            <Plus data-icon="inline-start" />
            Add module
          </Button>
        </div>
      </div>

      <Alert>
        <Info />
        <AlertTitle>Local file-backed module configuration</AlertTitle>
        <AlertDescription>
          Saved changes are written to src/data/module-configuration.json and immediately update the Sidebar and Search
          menu. Visibility is a navigation preference, not authorization; existing Proxy and role rules still protect
          routes. A Next.js route must exist in the deployed code before a custom module URL can render a page.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ModuleSummaryCard
          title="Managed modules"
          value={activeModules.length}
          description="Includes the protected Web Module."
        />
        <ModuleSummaryCard
          title="Enabled"
          value={enabledCount}
          description={`${activeModules.length - enabledCount} disabled`}
        />
        <ModuleSummaryCard title="API connected" value={apiCount} description="Modules with an endpoint configured." />
        <ModuleSummaryCard
          title="Custom modules"
          value={customCount}
          description="Saved in the local configuration file."
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sidebar modules</CardTitle>
          <CardDescription>
            Reorder modules within their current group and edit each module&apos;s integration metadata.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(16rem,1fr)_14rem_12rem]">
            <InputGroup>
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                aria-label="Search modules"
                placeholder="Search name, route, dataset, API or page file..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </InputGroup>

            <Select value={groupFilter} onValueChange={setGroupFilter}>
              <SelectTrigger className="w-full" aria-label="Filter by Sidebar group">
                <SelectValue placeholder="All groups" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value={allGroupsValue}>All groups</SelectItem>
                  {moduleGroups.map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full" aria-label="Filter by module status">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value={allStatusesValue}>All statuses</SelectItem>
                  <SelectItem value="enabled">Enabled</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <DndContext
              id="module-management-table"
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredModules.map((module) => module.id)}
                strategy={verticalListSortingStrategy}
              >
                <Table className="min-w-[1180px]">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-20 text-center">Order</TableHead>
                      <TableHead>Module</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Dataset</TableHead>
                      <TableHead>API</TableHead>
                      <TableHead>Page binding</TableHead>
                      <TableHead className="w-28 text-center">Enabled</TableHead>
                      <TableHead className="w-20 text-center">Edit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredModules.length > 0 ? (
                      filteredModules.map((module) => (
                        <SortableModuleRow
                          key={module.id}
                          module={module}
                          onEdit={openEditDialog}
                          onUpdate={updateModule}
                        />
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="h-28 text-center text-muted-foreground">
                          No modules match the current filters.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </SortableContext>
            </DndContext>
          </div>
        </CardContent>
      </Card>

      <ModuleEditorDialog
        mode={dialogMode}
        draft={draft}
        errors={formErrors}
        isSaving={isSaving}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onDraftChange={updateDraft}
        onDelete={requestModuleDeletion}
        onSubmit={handleDialogSubmit}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={handleDeleteDialogOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {modulePendingDeletion?.title ?? "module"}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the module from the management list, Sidebar and Search after you save changes. Source page
              files are not deleted, so the same page route can be added again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmModuleDeletion}>
              Delete module
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SortableModuleRow({
  module,
  onEdit,
  onUpdate,
}: {
  module: ModuleRecord;
  onEdit: (module: ModuleRecord) => void;
  onUpdate: (moduleId: string, update: Partial<ModuleRecord>) => void;
}) {
  const ModuleIcon = getModuleIcon(module.iconName);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: module.id,
    data: { group: module.group },
  });

  return (
    <TableRow
      ref={setNodeRef}
      data-state={isDragging ? "selected" : undefined}
      style={{
        transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined,
        transition,
      }}
    >
      <TableCell className="text-center">
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label={`Drag to reorder ${module.title}`}
          className="touch-none cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <Menu />
        </Button>
      </TableCell>
      <TableCell>
        <div className="flex min-w-40 items-start gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <ModuleIcon />
          </span>
          <div className="flex flex-col gap-1">
            <span className="font-medium">{module.title}</span>
            <Badge variant="outline" className="w-fit">
              {module.source === "system" ? "System" : "Custom"}
            </Badge>
          </div>
        </div>
      </TableCell>
      <TableCell>{module.group}</TableCell>
      <TableCell>
        <code className="text-xs">{module.route}</code>
      </TableCell>
      <TableCell>{module.dataset || <span className="text-muted-foreground">Not configured</span>}</TableCell>
      <TableCell>
        {module.apiEndpoint ? (
          <code className="text-xs">{module.apiEndpoint}</code>
        ) : (
          <span className="text-muted-foreground">Not configured</span>
        )}
      </TableCell>
      <TableCell>
        <code className="block max-w-72 truncate text-xs" title={module.pageFile}>
          {module.pageFile}
        </code>
      </TableCell>
      <TableCell className="text-center">
        <div className="flex flex-col items-center gap-2">
          <Switch
            aria-label={
              module.id === MODULE_MANAGEMENT_ID
                ? "Web Module is always enabled"
                : `${module.enabled ? "Disable" : "Enable"} ${module.title}`
            }
            checked={module.id === MODULE_MANAGEMENT_ID ? true : module.enabled}
            disabled={module.id === MODULE_MANAGEMENT_ID}
            onCheckedChange={(enabled) => onUpdate(module.id, { enabled })}
          />
          <Badge
            variant={module.id === MODULE_MANAGEMENT_ID || module.enabled ? "default" : "secondary"}
          >
            {module.id === MODULE_MANAGEMENT_ID || module.enabled ? "Enabled" : "Disabled"}
          </Badge>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label={`Edit ${module.title}`}
          onClick={() => onEdit(module)}
        >
          <Pencil />
        </Button>
      </TableCell>
    </TableRow>
  );
}

function ModuleSummaryCard({
  title,
  value,
  description,
}: {
  title: string;
  value: number;
  description: string;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle>{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground text-xs">{description}</CardContent>
    </Card>
  );
}

function ModuleEditorDialog({
  mode,
  draft,
  errors,
  isSaving,
  open,
  onOpenChange,
  onDraftChange,
  onDelete,
  onSubmit,
}: {
  mode: ModuleDialogMode;
  draft: ModuleRecord | null;
  errors: ModuleFormErrors;
  isSaving: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDraftChange: <K extends keyof ModuleRecord>(field: K, value: ModuleRecord[K]) => void;
  onDelete: (module: ModuleRecord) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  if (!draft) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Add module" : `Edit ${draft.title}`}</DialogTitle>
          <DialogDescription>
            Configure navigation metadata and the module&apos;s intended data, API and page-code bindings.
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" noValidate onSubmit={onSubmit}>
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={Boolean(errors.title)}>
              <FieldLabel htmlFor="module-title">Module name</FieldLabel>
              <Input
                id="module-title"
                value={draft.title}
                aria-invalid={Boolean(errors.title)}
                placeholder="e.g. Fleet Reports"
                onChange={(event) => onDraftChange("title", event.target.value)}
              />
              {errors.title && <FieldError>{errors.title}</FieldError>}
            </Field>

            <Field>
              <FieldLabel htmlFor="module-group">Sidebar group</FieldLabel>
              <Select
                value={draft.group}
                onValueChange={(group) => onDraftChange("group", group)}
              >
                <SelectTrigger id="module-group" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {moduleGroups.map((group) => (
                      <SelectItem key={group} value={group}>
                        {group}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>
                Moves the module and its page link to another Sidebar group after Save module. Route permissions are
                unchanged.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="module-icon">Sidebar icon</FieldLabel>
              <Select
                value={draft.iconName}
                onValueChange={(iconName) =>
                  onDraftChange("iconName", iconName as ModuleRecord["iconName"])
                }
              >
                <SelectTrigger id="module-icon" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {moduleIconOptions.map((option) => {
                      const Icon = option.icon;

                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <Icon />
                          {option.label}
                        </SelectItem>
                      );
                    })}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>Applied to the Sidebar after Save module.</FieldDescription>
            </Field>

            <Field data-invalid={Boolean(errors.route)}>
              <FieldLabel htmlFor="module-route">Route</FieldLabel>
              <Input
                id="module-route"
                value={draft.route}
                aria-invalid={Boolean(errors.route)}
                placeholder="/dashboard/fleet-reports"
                onChange={(event) => onDraftChange("route", event.target.value)}
              />
              {errors.route ? (
                <FieldError>{errors.route}</FieldError>
              ) : (
                <FieldDescription>Multiple modules can link to the same route.</FieldDescription>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="module-dataset">Dataset / resource</FieldLabel>
              <Input
                id="module-dataset"
                value={draft.dataset}
                placeholder="e.g. Van utilisation records"
                onChange={(event) => onDraftChange("dataset", event.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="module-api-endpoint">
                <Braces />
                API endpoint
              </FieldLabel>
              <Input
                id="module-api-endpoint"
                value={draft.apiEndpoint}
                placeholder="/api/fleet/reports"
                onChange={(event) => onDraftChange("apiEndpoint", event.target.value)}
              />
              <FieldDescription>Leave blank while the module uses mock or static data.</FieldDescription>
            </Field>

            <Field data-invalid={Boolean(errors.pageFile)}>
              <FieldLabel htmlFor="module-page-file">
                <Database />
                Page code binding
              </FieldLabel>
              <Input
                id="module-page-file"
                value={draft.pageFile}
                aria-invalid={Boolean(errors.pageFile)}
                placeholder="src/app/(main)/dashboard/fleet-reports/page.tsx"
                onChange={(event) => onDraftChange("pageFile", event.target.value)}
              />
              {errors.pageFile ? (
                <FieldError>{errors.pageFile}</FieldError>
              ) : (
                <FieldDescription>
                  Multiple modules can bind to the same page file. The file must exist in the deployed Next.js build.
                </FieldDescription>
              )}
            </Field>

            <Field
              orientation="horizontal"
              className="sm:col-span-2"
              data-disabled={draft.id === MODULE_MANAGEMENT_ID}
            >
              <FieldContent>
                <FieldLabel htmlFor="module-enabled">Module enabled</FieldLabel>
                <FieldDescription>
                  {draft.id === MODULE_MANAGEMENT_ID
                    ? "Web Module is protected and must remain enabled."
                    : "Controls whether this Sidebar module should be available."}
                </FieldDescription>
              </FieldContent>
              <Switch
                id="module-enabled"
                checked={draft.id === MODULE_MANAGEMENT_ID ? true : draft.enabled}
                disabled={draft.id === MODULE_MANAGEMENT_ID}
                onCheckedChange={(enabled) => onDraftChange("enabled", enabled)}
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            {mode === "edit" && (
              <Button
                type="button"
                variant="destructive"
                className="sm:mr-auto"
                disabled={draft.id === MODULE_MANAGEMENT_ID}
                title={draft.id === MODULE_MANAGEMENT_ID ? "Web Module cannot be deleted." : undefined}
                onClick={() => onDelete(draft)}
              >
                <Trash2 data-icon="inline-start" />
                Delete
              </Button>
            )}
            <Button type="button" variant="outline" disabled={isSaving} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {mode === "add" ? "Add module" : "Save module"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
