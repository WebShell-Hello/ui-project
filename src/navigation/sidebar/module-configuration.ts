import {
  Banknote,
  Calendar,
  CarFront,
  ChartBar,
  ChartGantt,
  CheckSquare,
  FileText,
  Fingerprint,
  FolderOpen,
  Forklift,
  Gauge,
  GraduationCap,
  Kanban,
  LayoutDashboard,
  ListTodo,
  Lock,
  Mail,
  MessageSquare,
  PanelsTopLeft,
  ReceiptText,
  Server,
  ShoppingBag,
  SquareArrowUpRight,
  Users,
} from "lucide-react";
import { z } from "zod";

import {
  getLocalStorageValue,
  removeLocalStorageValue,
  setLocalStorageValue,
} from "@/lib/local-storage.client";
import {
  type NavGroup,
  type NavMainItem,
  type NavSubItem,
  sidebarItems,
} from "@/navigation/sidebar/sidebar-items";
import {
  MODULE_MANAGEMENT_ID,
  type ModuleIconName,
  type ModuleRecord,
  moduleConfigurationSchema,
  moduleIconNames,
  moduleRecordSchema,
} from "@/navigation/sidebar/module-configuration.shared";

export { MODULE_MANAGEMENT_ID, type ModuleIconName, type ModuleRecord };
const V1_MODULE_CONFIGURATION_STORAGE_KEY = "studio-admin:module-configuration:v1";
const V2_MODULE_CONFIGURATION_STORAGE_KEY = "studio-admin:module-configuration:v2";
export const MODULE_CONFIGURATION_STORAGE_KEY = "studio-admin:module-configuration:v3";
export const MODULE_CONFIGURATION_STORAGE_KEYS = [
  MODULE_CONFIGURATION_STORAGE_KEY,
  V2_MODULE_CONFIGURATION_STORAGE_KEY,
  V1_MODULE_CONFIGURATION_STORAGE_KEY,
] as const;
export const MODULE_CONFIGURATION_UPDATED_EVENT = "studio-admin:module-configuration-updated";

export const moduleIconOptions = [
  { value: "banknote", label: "Banknote", icon: Banknote },
  { value: "calendar", label: "Calendar", icon: Calendar },
  { value: "car-front", label: "Vehicle", icon: CarFront },
  { value: "chart-bar", label: "Bar chart", icon: ChartBar },
  { value: "chart-gantt", label: "Timeline", icon: ChartGantt },
  { value: "check-square", label: "Checklist", icon: CheckSquare },
  { value: "file-text", label: "Document", icon: FileText },
  { value: "fingerprint", label: "Authentication", icon: Fingerprint },
  { value: "folder-open", label: "Folder", icon: FolderOpen },
  { value: "forklift", label: "Logistics", icon: Forklift },
  { value: "gauge", label: "Gauge", icon: Gauge },
  { value: "graduation-cap", label: "Academy", icon: GraduationCap },
  { value: "kanban", label: "Kanban", icon: Kanban },
  { value: "layout-dashboard", label: "Dashboard", icon: LayoutDashboard },
  { value: "list-todo", label: "Task list", icon: ListTodo },
  { value: "lock", label: "Lock", icon: Lock },
  { value: "mail", label: "Mail", icon: Mail },
  { value: "message-square", label: "Messages", icon: MessageSquare },
  { value: "panels-top-left", label: "Module", icon: PanelsTopLeft },
  { value: "receipt-text", label: "Invoice", icon: ReceiptText },
  { value: "server", label: "Server", icon: Server },
  { value: "shopping-bag", label: "Commerce", icon: ShoppingBag },
  { value: "square-arrow-up-right", label: "External link", icon: SquareArrowUpRight },
  { value: "users", label: "Users", icon: Users },
] as const satisfies ReadonlyArray<{
  value: ModuleIconName;
  label: string;
  icon: typeof PanelsTopLeft;
}>;

const moduleIconByName = new Map(moduleIconOptions.map((option) => [option.value, option.icon]));

export function getModuleIcon(iconName: ModuleIconName) {
  return moduleIconByName.get(iconName) ?? PanelsTopLeft;
}

function getModuleIconName(icon: NavMainItem["icon"] | NavSubItem["icon"]): ModuleIconName {
  return moduleIconOptions.find((option) => option.icon === icon)?.value ?? "panels-top-left";
}

const v2ModuleConfigurationSchema = z.object({
  version: z.literal(2),
  modules: z.array(moduleRecordSchema),
});

const v1ModuleConfigurationSchema = z.object({
  version: z.literal(1),
  modules: z.array(
    moduleRecordSchema.extend({
      iconName: z.enum(moduleIconNames).optional(),
      deleted: z.boolean().optional(),
    }),
  ),
});

const datasetByModuleId: Record<string, string> = {
  timesheets: "Timesheet submissions",
  invoices: "Invoice records",
  contracts: "Client contracts",
  "driver-profiles": "Driver records",
  "users-profiles": "User profiles",
  vans: "Van records",
  documents: "Document records",
  "roles-management": "Roles and permissions",
  users: "System users",
  roles: "Roles and permissions",
};

const apiByModuleId: Record<string, string> = {
  timesheets: "/api/timesheets/upload",
  "auth-login-v1": "/api/auth/login",
  "auth-login-v2": "/api/auth/login",
};

function getPageFile(route: string, moduleId: string) {
  if (route.startsWith("/auth/")) {
    return `src/app/(main)${route}/page.tsx`;
  }

  if (moduleId.startsWith("legacy-")) {
    return `src/app/(main)/dashboard/(legacy)/${route.split("/").at(-1)}/page.tsx`;
  }

  return `src/app/(main)${route}/page.tsx`;
}

export const moduleGroups = sidebarItems.map((group) => group.label ?? `Group ${group.id}`);

function migrateLegacyGroup(group: string) {
  if (group === "Dashboards") {
    return "Pages";
  }

  if (group === "Pages") {
    return "Functions";
  }

  return group;
}

export function createModuleRecords(): ModuleRecord[] {
  return sidebarItems.flatMap((group) => {
    const groupName = group.label ?? `Group ${group.id}`;
    let order = 0;

    return group.items.flatMap((item) => {
      if ("url" in item) {
        order += 1;

        return [
          {
            id: item.id,
            title: item.title,
            group: groupName,
            route: item.url,
            enabled: !item.disabled,
            order,
            dataset: datasetByModuleId[item.id] ?? "Mock dashboard dataset",
            apiEndpoint: apiByModuleId[item.id] ?? "",
            pageFile: getPageFile(item.url, item.id),
            iconName: getModuleIconName(item.icon),
            deleted: false,
            source: "system" as const,
          },
        ];
      }

      return item.subItems.flatMap((subItem) => {
        order += 1;

        return [
          {
            id: subItem.id,
            title: subItem.title,
            group: groupName,
            route: subItem.url,
            enabled: !subItem.disabled,
            order,
            dataset: datasetByModuleId[subItem.id] ?? "Authentication dataset",
            apiEndpoint: apiByModuleId[subItem.id] ?? "",
            pageFile: getPageFile(subItem.url, subItem.id),
            iconName: getModuleIconName(subItem.icon ?? item.icon),
            deleted: false,
            source: "system" as const,
          },
        ];
      });
    });
  });
}

export function readModuleConfiguration(): ModuleRecord[] | null {
  const storedValue = getLocalStorageValue(MODULE_CONFIGURATION_STORAGE_KEY);

  if (storedValue) {
    try {
      const parsedValue: unknown = JSON.parse(storedValue);
      const result = moduleConfigurationSchema.safeParse(parsedValue);

      if (result.success) {
        return result.data.modules;
      }
    } catch {
      // Fall back to earlier configuration versions below.
    }
  }

  const v2StoredValue = getLocalStorageValue(V2_MODULE_CONFIGURATION_STORAGE_KEY);

  if (v2StoredValue) {
    try {
      const parsedValue: unknown = JSON.parse(v2StoredValue);
      const result = v2ModuleConfigurationSchema.safeParse(parsedValue);

      if (result.success) {
        return result.data.modules.map((module) => ({
          ...module,
          group: migrateLegacyGroup(module.group),
        }));
      }
    } catch {
      // Fall back to the v1 configuration below.
    }
  }

  const legacyStoredValue = getLocalStorageValue(V1_MODULE_CONFIGURATION_STORAGE_KEY);

  if (!legacyStoredValue) {
    return null;
  }

  try {
    const parsedValue: unknown = JSON.parse(legacyStoredValue);
    const result = v1ModuleConfigurationSchema.safeParse(parsedValue);

    if (!result.success) {
      return null;
    }

    const defaultIconById = new Map(
      createModuleRecords().map((module) => [module.id, module.iconName]),
    );

    return result.data.modules.map((module) => {
      const defaultIconName = defaultIconById.get(module.id) ?? "panels-top-left";
      const legacyIconName = module.iconName;
      const shouldRestoreSystemIcon =
        module.source === "system" &&
        (!legacyIconName ||
          (legacyIconName === "panels-top-left" && defaultIconName !== "panels-top-left"));

      return {
        ...module,
        group: migrateLegacyGroup(module.group),
        iconName: shouldRestoreSystemIcon
          ? defaultIconName
          : (legacyIconName ?? defaultIconName),
        deleted: module.deleted ?? false,
      };
    });
  } catch {
    return null;
  }
}

export function mergeModuleConfiguration(
  defaultModules: ModuleRecord[],
  savedModules: ModuleRecord[] | null,
): ModuleRecord[] {
  if (!savedModules) {
    return defaultModules;
  }

  const savedById = new Map(savedModules.map((module) => [module.id, module]));
  const mergedSystemModules = defaultModules.map((module) => {
    const savedModule = savedById.get(module.id);
    const mergedModule = savedModule
      ? { ...module, ...savedModule, source: "system" as const }
      : module;

    return module.id === MODULE_MANAGEMENT_ID
      ? { ...mergedModule, enabled: true, deleted: false }
      : mergedModule;
  });
  const existingIds = new Set(mergedSystemModules.map((module) => module.id));
  const savedCustomModules = savedModules.filter(
    (module) =>
      module.source === "custom" &&
      module.id !== MODULE_MANAGEMENT_ID &&
      module.route !== "/dashboard/module-management" &&
      moduleGroups.includes(module.group) &&
      !existingIds.has(module.id),
  );

  return [...mergedSystemModules, ...savedCustomModules];
}

function notifyModuleConfigurationUpdated() {
  window.dispatchEvent(new Event(MODULE_CONFIGURATION_UPDATED_EVENT));
}

export function saveModuleConfiguration(modules: ModuleRecord[]) {
  const configuration = moduleConfigurationSchema.parse({
    version: 3,
    modules: modules.map((module) =>
      module.id === MODULE_MANAGEMENT_ID
        ? { ...module, enabled: true, deleted: false }
        : module,
    ),
  });

  setLocalStorageValue(MODULE_CONFIGURATION_STORAGE_KEY, JSON.stringify(configuration));
  removeLocalStorageValue(V2_MODULE_CONFIGURATION_STORAGE_KEY);
  removeLocalStorageValue(V1_MODULE_CONFIGURATION_STORAGE_KEY);
  notifyModuleConfigurationUpdated();
}

async function getConfigurationError(response: Response, fallbackMessage: string) {
  const body: unknown = await response.json().catch(() => null);

  return body && typeof body === "object" && "message" in body && typeof body.message === "string"
    ? body.message
    : fallbackMessage;
}

export async function persistModuleConfiguration(modules: ModuleRecord[]) {
  const configuration = moduleConfigurationSchema.parse({
    version: 3,
    modules: modules.map((module) =>
      module.id === MODULE_MANAGEMENT_ID
        ? { ...module, enabled: true, deleted: false }
        : module,
    ),
  });
  const response = await fetch("/api/module-configuration", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(configuration),
  });

  if (!response.ok) {
    throw new Error(await getConfigurationError(response, "Unable to save the module configuration."));
  }

  saveModuleConfiguration(configuration.modules);
}

export function clearModuleConfiguration() {
  removeLocalStorageValue(MODULE_CONFIGURATION_STORAGE_KEY);
  removeLocalStorageValue(V2_MODULE_CONFIGURATION_STORAGE_KEY);
  removeLocalStorageValue(V1_MODULE_CONFIGURATION_STORAGE_KEY);
  notifyModuleConfigurationUpdated();
}

export async function clearPersistedModuleConfiguration() {
  const response = await fetch("/api/module-configuration", { method: "DELETE" });

  if (!response.ok) {
    throw new Error(await getConfigurationError(response, "Unable to reset the module configuration."));
  }

  clearModuleConfiguration();
}

function configureSubItem(
  subItem: NavSubItem,
  groupName: string,
  recordsById: Map<string, ModuleRecord>,
): NavSubItem | null {
  const record = recordsById.get(subItem.id);

  if (record && (!record.enabled || record.deleted || record.group !== groupName)) {
    return null;
  }

  return record
    ? {
        ...subItem,
        title: record.title,
        url: record.route,
        icon: getModuleIcon(record.iconName),
        disabled: false,
      }
    : subItem;
}

function getItemOrder(item: NavMainItem, recordsById: Map<string, ModuleRecord>, fallbackOrder: number) {
  if ("url" in item) {
    return recordsById.get(item.id)?.order ?? fallbackOrder;
  }

  const subItemOrders = item.subItems.flatMap((subItem) => {
    const order = recordsById.get(subItem.id)?.order;
    return order === undefined ? [] : [order];
  });

  return subItemOrders.length > 0 ? Math.min(...subItemOrders) : fallbackOrder;
}

export function applyModuleConfiguration(
  groups: readonly NavGroup[],
  modules: ModuleRecord[] | null,
): NavGroup[] {
  if (!modules) {
    return [...groups];
  }

  const recordsById = new Map(modules.map((module) => [module.id, module]));
  const sourceGroupById = new Map<string, string>();
  const sourceItemById = new Map<string, NavMainItem>();

  for (const group of groups) {
    const groupName = group.label ?? `Group ${group.id}`;

    for (const item of group.items) {
      if ("url" in item) {
        sourceGroupById.set(item.id, groupName);
        sourceItemById.set(item.id, item);
        continue;
      }

      for (const subItem of item.subItems) {
        sourceGroupById.set(subItem.id, groupName);
        sourceItemById.set(subItem.id, {
          ...subItem,
          icon: subItem.icon ?? item.icon,
        });
      }
    }
  }

  return groups.map((group) => {
    const groupName = group.label ?? `Group ${group.id}`;
    const configuredItems = group.items.flatMap((item, sourceIndex) => {
      if ("url" in item) {
        const record = recordsById.get(item.id);

        if (record && record.group !== groupName) {
          return [];
        }

        if (
          record &&
          ((record.deleted && item.id !== MODULE_MANAGEMENT_ID) ||
            (!record.enabled && item.id !== MODULE_MANAGEMENT_ID))
        ) {
          return [];
        }

        const configuredItem: NavMainItem = record
          ? {
              ...item,
              title: record.title,
              url: record.route,
              icon: getModuleIcon(record.iconName),
              disabled: false,
            }
          : item;

        return [
          {
            item: configuredItem,
            order: record?.order ?? sourceIndex + 1,
          },
        ];
      }

      const configuredSubItems = item.subItems
        .flatMap((subItem) => {
          const configuredSubItem = configureSubItem(subItem, groupName, recordsById);
          return configuredSubItem ? [configuredSubItem] : [];
        })
        .sort(
          (firstSubItem, secondSubItem) =>
            (recordsById.get(firstSubItem.id)?.order ?? 0) -
            (recordsById.get(secondSubItem.id)?.order ?? 0),
        );

      if (configuredSubItems.length === 0) {
        return [];
      }

      const configuredItem: NavMainItem = {
        ...item,
        subItems: configuredSubItems,
      };

      return [
        {
          item: configuredItem,
          order: getItemOrder(configuredItem, recordsById, sourceIndex + 1),
        },
      ];
    });
    const movedSystemItems = modules
      .filter(
        (module) =>
          module.source === "system" &&
          module.enabled &&
          !module.deleted &&
          module.group === groupName &&
          sourceGroupById.get(module.id) !== groupName,
      )
      .flatMap((module) => {
        const sourceItem = sourceItemById.get(module.id);

        if (!sourceItem || !("url" in sourceItem)) {
          return [];
        }

        return [
          {
            item: {
              ...sourceItem,
              title: module.title,
              url: module.route,
              icon: getModuleIcon(module.iconName),
              disabled: false,
            } satisfies NavMainItem,
            order: module.order,
          },
        ];
      });
    const customItems = modules
      .filter(
        (module) =>
          module.source === "custom" &&
          module.enabled &&
          !module.deleted &&
          module.group === groupName,
      )
      .map(({ id, title, route, order, iconName }) => ({
        item: {
          id,
          title,
          url: route,
          icon: getModuleIcon(iconName),
        } satisfies NavMainItem,
        order,
      }));
    const sortedItems = [...configuredItems, ...movedSystemItems, ...customItems]
      .sort((firstItem, secondItem) => firstItem.order - secondItem.order)
      .map(({ item }) => item);

    return {
      ...group,
      items: sortedItems,
    };
  });
}
