import "server-only";

import { readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { z } from "zod";

import { files, folders } from "@/app/(main)/dashboard/documents/_components/data";
import { driverTestData } from "@/app/(main)/dashboard/driver-profiles/_components/driver-data";
import { vanTestData } from "@/app/(main)/dashboard/vans/_components/van-data";
import {
  type DocumentManagerState,
  documentManagerStateSchema,
  driverDataSchema,
  vanDataSchema,
} from "@/lib/local-business-data.schemas";

const documentManagerFilePath = path.join(process.cwd(), "src", "data", "document-manager.json");
const vanDataFilePath = path.join(process.cwd(), "src", "data", "vans.json");
const driverDataFilePath = path.join(process.cwd(), "src", "data", "driver-profiles.json");

const writeQueues = new Map<string, Promise<void>>();

async function readJsonFile<T>(filePath: string, schema: z.ZodType<T>): Promise<T | null> {
  try {
    const value: unknown = JSON.parse(await readFile(filePath, "utf8"));
    return schema.parse(value);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

function writeJsonFile(filePath: string, value: unknown) {
  const previousWrite = writeQueues.get(filePath) ?? Promise.resolve();
  const operation = previousWrite.then(async () => {
    const temporaryPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;

    try {
      await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, {
        encoding: "utf8",
        mode: 0o600,
      });
      await rename(temporaryPath, filePath);
    } finally {
      await rm(temporaryPath, { force: true }).catch(() => undefined);
    }
  });

  writeQueues.set(filePath, operation.catch(() => undefined));
  return operation;
}

export async function readDocumentManagerState() {
  const savedState = await readJsonFile(documentManagerFilePath, documentManagerStateSchema);

  if (savedState) {
    return { state: savedState, persisted: savedState.legacyMigrationComplete };
  }

  const initialState = documentManagerStateSchema.parse({
    version: 1,
    legacyMigrationComplete: false,
    folders,
    files,
  });
  await writeJsonFile(documentManagerFilePath, initialState);

  return {
    state: initialState,
    persisted: false,
  };
}

export function writeDocumentManagerState(state: DocumentManagerState) {
  return writeJsonFile(documentManagerFilePath, documentManagerStateSchema.parse(state));
}

export async function readVanData() {
  const savedData = await readJsonFile(vanDataFilePath, vanDataSchema);

  if (savedData) {
    return savedData.vans;
  }

  const initialData = vanDataSchema.parse({ version: 1, vans: vanTestData });
  await writeJsonFile(vanDataFilePath, initialData);
  return initialData.vans;
}

export function writeVanData(vans: z.infer<typeof vanDataSchema>["vans"]) {
  return writeJsonFile(vanDataFilePath, vanDataSchema.parse({ version: 1, vans }));
}

export async function readDriverData() {
  const savedData = await readJsonFile(driverDataFilePath, driverDataSchema);

  if (savedData) {
    return savedData.drivers;
  }

  const initialData = driverDataSchema.parse({ version: 1, drivers: driverTestData });
  await writeJsonFile(driverDataFilePath, initialData);
  return initialData.drivers;
}

export function writeDriverData(drivers: z.infer<typeof driverDataSchema>["drivers"]) {
  return writeJsonFile(driverDataFilePath, driverDataSchema.parse({ version: 1, drivers }));
}
