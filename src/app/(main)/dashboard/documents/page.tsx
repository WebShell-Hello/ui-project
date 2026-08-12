import { readDocumentManagerState } from "@/lib/local-business-data.server";

import type { FileManagerView } from "./_components/data";
import { DocumentsManager } from "./_components/documents-manager";

interface PageProps {
  searchParams: Promise<{ folder?: string | string[]; view?: string | string[] }>;
}

export default async function Page({ searchParams }: PageProps) {
  const { folder, view } = await searchParams;
  const initialFolderId = typeof folder === "string" ? folder : undefined;
  const initialView: FileManagerView = view === "list" ? "list" : "grid";
  const { state, persisted } = await readDocumentManagerState();

  return (
    <DocumentsManager
      initialFiles={state.files}
      initialFolders={state.folders}
      initialFolderId={initialFolderId}
      initialView={initialView}
      hasPersistedState={persisted}
    />
  );
}
