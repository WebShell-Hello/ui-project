import "server-only";

import { readFile, rename, rm, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  MODULE_MANAGEMENT_ID,
  type ModuleConfiguration,
  type ModuleRecord,
  moduleConfigurationSchema,
} from "@/navigation/sidebar/module-configuration.shared";

export const moduleConfigurationFilePath = path.join(
  process.cwd(),
  "src",
  "data",
  "module-configuration.json",
);

function normalizeConfiguration(modules: ModuleRecord[]): ModuleConfiguration {
  return moduleConfigurationSchema.parse({
    version: 3,
    modules: modules.map((module) =>
      module.id === MODULE_MANAGEMENT_ID
        ? { ...module, enabled: true, deleted: false }
        : module,
    ),
  });
}

export async function readModuleConfigurationFile(): Promise<ModuleRecord[] | null> {
  try {
    const source = await readFile(moduleConfigurationFilePath, "utf8");
    const parsedValue: unknown = JSON.parse(source);
    return moduleConfigurationSchema.parse(parsedValue).modules;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

let writeQueue: Promise<void> = Promise.resolve();

export function writeModuleConfigurationFile(modules: ModuleRecord[]) {
  const configuration = normalizeConfiguration(modules);

  const operation = writeQueue.then(async () => {
    const temporaryPath = `${moduleConfigurationFilePath}.${process.pid}.${Date.now()}.tmp`;

    try {
      await writeFile(temporaryPath, `${JSON.stringify(configuration, null, 2)}\n`, {
        encoding: "utf8",
        mode: 0o600,
      });
      await rename(temporaryPath, moduleConfigurationFilePath);
    } finally {
      await rm(temporaryPath, { force: true }).catch(() => undefined);
    }
  });

  writeQueue = operation.catch(() => undefined);
  return operation;
}

export function deleteModuleConfigurationFile() {
  const operation = writeQueue.then(async () => {
    await unlink(moduleConfigurationFilePath).catch((error: unknown) => {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) {
        throw error;
      }
    });
  });

  writeQueue = operation.catch(() => undefined);
  return operation;
}
