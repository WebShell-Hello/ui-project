import { z } from "zod";

export const MODULE_MANAGEMENT_ID = "module-management";

export const moduleIconNames = [
  "banknote",
  "calendar",
  "car-front",
  "chart-bar",
  "chart-gantt",
  "check-square",
  "file-text",
  "fingerprint",
  "folder-open",
  "forklift",
  "gauge",
  "graduation-cap",
  "kanban",
  "layout-dashboard",
  "list-todo",
  "lock",
  "mail",
  "message-square",
  "panels-top-left",
  "receipt-text",
  "server",
  "shopping-bag",
  "square-arrow-up-right",
  "users",
] as const;

export type ModuleIconName = (typeof moduleIconNames)[number];

export const moduleRecordSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  group: z.string().min(1),
  route: z.string().startsWith("/"),
  enabled: z.boolean(),
  order: z.number().int().positive(),
  dataset: z.string(),
  apiEndpoint: z.string(),
  pageFile: z.string(),
  iconName: z.enum(moduleIconNames),
  deleted: z.boolean(),
  source: z.enum(["system", "custom"]),
});

export const moduleConfigurationSchema = z.object({
  version: z.literal(3),
  modules: z.array(moduleRecordSchema),
});

export type ModuleRecord = z.infer<typeof moduleRecordSchema>;
export type ModuleConfiguration = z.infer<typeof moduleConfigurationSchema>;
