"use client";

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { ArrowLeft, FileQuestion, FolderPlus, Grid2X2, List, Trash2, Upload } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { persistLocalData } from "@/lib/persist-local-data.client";

import {
  type FileManagerFile,
  type FileManagerFolder,
  type FileManagerView,
  folders,
  unclassifiedFolderId,
} from "./data";
import { FileGridView } from "./file-grid-view";
import { FileListView } from "./file-list-view";
import { FileManagerToolbar } from "./file-manager-toolbar";
import { FoldersSection } from "./folders-section";

const storageKey = "studio-admin-document-manager-preferences";
const defaultFolderIds = new Set(folders.map((folder) => folder.id));

interface DocumentManagerPreferences {
  customFolders: FileManagerFolder[];
  deletedFolderIds: string[];
  fileFolderOverrides: Record<string, string>;
}

interface DocumentsManagerProps {
  initialFiles: FileManagerFile[];
  initialFolders: FileManagerFolder[];
  initialFolderId?: string;
  initialView: FileManagerView;
  hasPersistedState: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStoredFolder(value: unknown): value is FileManagerFolder {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.description === "string" &&
    typeof value.fileCount === "number" &&
    typeof value.size === "string" &&
    typeof value.updatedAt === "string" &&
    value.deletable === true
  );
}

function readPreferences(): DocumentManagerPreferences | null {
  try {
    const rawValue = window.localStorage.getItem(storageKey);

    if (!rawValue) {
      return null;
    }

    const value: unknown = JSON.parse(rawValue);

    if (!isRecord(value)) {
      return null;
    }

    const customFolders = Array.isArray(value.customFolders)
      ? value.customFolders.filter(isStoredFolder)
      : [];
    const deletedFolderIds = Array.isArray(value.deletedFolderIds)
      ? value.deletedFolderIds.filter((id): id is string => typeof id === "string")
      : [];
    const fileFolderOverrides = isRecord(value.fileFolderOverrides)
      ? Object.fromEntries(
          Object.entries(value.fileFolderOverrides).filter(
            (entry): entry is [string, string] => typeof entry[1] === "string",
          ),
        )
      : {};

    return { customFolders, deletedFolderIds, fileFolderOverrides };
  } catch {
    return null;
  }
}

function withFileCounts(managedFolders: FileManagerFolder[], managedFiles: FileManagerFile[]) {
  return managedFolders.map((folder) => ({
    ...folder,
    fileCount: managedFiles.filter((file) => file.folderId === folder.id).length,
  }));
}

export function DocumentsManager({
  initialFiles,
  initialFolders,
  initialFolderId,
  initialView,
  hasPersistedState,
}: DocumentsManagerProps) {
  const router = useRouter();
  const [managedFolders, setManagedFolders] = useState<FileManagerFolder[]>(initialFolders);
  const [managedFiles, setManagedFiles] = useState<FileManagerFile[]>(initialFiles);
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(() => new Set());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [folderNameError, setFolderNameError] = useState("");
  const [folderPendingDeletion, setFolderPendingDeletion] = useState<FileManagerFolder | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const migrationAttempted = useRef(false);

  useEffect(() => {
    if (hasPersistedState || migrationAttempted.current) {
      return;
    }

    migrationAttempted.current = true;

    const preferences = readPreferences();

    if (!preferences) {
      return;
    }

    const deletedIds = new Set(preferences.deletedFolderIds);
    const nextFolders = [
      ...initialFolders.filter((folder) => !folder.deletable || !deletedIds.has(folder.id)),
      ...preferences.customFolders.filter((folder) => !defaultFolderIds.has(folder.id)),
    ];
    const availableFolderIds = new Set(nextFolders.map((folder) => folder.id));
    const nextFiles = initialFiles.map((file) => {
      const preferredFolderId = preferences.fileFolderOverrides[file.id] ?? file.folderId;

      return {
        ...file,
        folderId: availableFolderIds.has(preferredFolderId) ? preferredFolderId : unclassifiedFolderId,
      };
    });
    const countedFolders = withFileCounts(nextFolders, nextFiles);

    setIsSaving(true);
    void persistLocalData<{ folders: FileManagerFolder[]; files: FileManagerFile[] }>("/api/documents/state", {
      version: 1,
      legacyMigrationComplete: true,
      folders: countedFolders,
      files: nextFiles,
    })
      .then((savedState) => {
        setManagedFolders(savedState.folders);
        setManagedFiles(savedState.files);
        window.localStorage.removeItem(storageKey);
        toast.success("Existing document changes were migrated to the local data file.");
      })
      .catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : "Unable to migrate the document data.");
      })
      .finally(() => {
        setIsSaving(false);
      });
  }, [hasPersistedState, initialFiles, initialFolders]);

  useEffect(() => {
    setSelectedFileIds(new Set());
  }, [initialFolderId]);

  const folderSummaries = useMemo(
    () => withFileCounts(managedFolders, managedFiles),
    [managedFiles, managedFolders],
  );
  const activeFolder = folderSummaries.find((folder) => folder.id === initialFolderId);
  const activeFiles = activeFolder
    ? managedFiles.filter((file) => file.folderId === activeFolder.id)
    : [];

  function openFolder(folderId: string) {
    router.push(`/dashboard/documents?folder=${encodeURIComponent(folderId)}&view=grid`);
  }

  function showAllFolders() {
    router.push("/dashboard/documents");
  }

  function changeView(view: FileManagerView) {
    if (!activeFolder) {
      return;
    }

    router.replace(
      `/dashboard/documents?folder=${encodeURIComponent(activeFolder.id)}&view=${view}`,
      { scroll: false },
    );
  }

  function toggleSelection(fileId: string) {
    setSelectedFileIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(fileId)) {
        nextIds.delete(fileId);
      } else {
        nextIds.add(fileId);
      }

      return nextIds;
    });
  }

  function selectAllFiles() {
    setSelectedFileIds(new Set(activeFiles.map((file) => file.id)));
  }

  async function persistDocuments(nextFolders: FileManagerFolder[], nextFiles: FileManagerFile[]) {
    const savedState = await persistLocalData<{
      folders: FileManagerFolder[];
      files: FileManagerFile[];
    }>("/api/documents/state", {
      version: 1,
      legacyMigrationComplete: true,
      folders: withFileCounts(nextFolders, nextFiles),
      files: nextFiles,
    });

    setManagedFolders(savedState.folders);
    setManagedFiles(savedState.files);
  }

  async function toggleStar(fileId: string) {
    if (isSaving) {
      return;
    }

    const nextFiles = managedFiles.map((file) =>
      file.id === fileId ? { ...file, starred: !file.starred } : file,
    );
    setIsSaving(true);

    try {
      await persistDocuments(managedFolders, nextFiles);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save the document data file.");
    } finally {
      setIsSaving(false);
    }
  }

  async function moveSelectedFiles(folderId: string) {
    const targetFolder = folderSummaries.find((folder) => folder.id === folderId);

    if (!targetFolder || selectedFileIds.size === 0 || isSaving) {
      return;
    }

    const movedCount = selectedFileIds.size;
    const nextFiles = managedFiles.map((file) =>
      selectedFileIds.has(file.id) ? { ...file, folderId } : file,
    );
    setIsSaving(true);

    try {
      await persistDocuments(managedFolders, nextFiles);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save the document data file.");
      return;
    } finally {
      setIsSaving(false);
    }

    setSelectedFileIds(new Set());
    toast.success(`${movedCount} file${movedCount === 1 ? "" : "s"} moved to ${targetFolder.name}.`);
  }

  async function createFolder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = newFolderName.trim();

    if (!trimmedName) {
      setFolderNameError("Enter a folder name.");
      return;
    }

    if (managedFolders.some((folder) => folder.name.toLowerCase() === trimmedName.toLowerCase())) {
      setFolderNameError("A folder with this name already exists.");
      return;
    }

    const folder: FileManagerFolder = {
      id: `custom-${Date.now().toString(36)}`,
      name: trimmedName,
      description: "Custom folder for organizing business documents.",
      fileCount: 0,
      size: "0 B",
      updatedAt: "Just now",
      deletable: true,
    };

    setIsSaving(true);

    try {
      await persistDocuments([...managedFolders, folder], managedFiles);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save the document data file.");
      return;
    } finally {
      setIsSaving(false);
    }

    setNewFolderName("");
    setFolderNameError("");
    setCreateDialogOpen(false);
    toast.success(`${folder.name} created.`);
  }

  async function deleteFolder() {
    const folder = folderPendingDeletion;

    if (!folder?.deletable || isSaving) {
      return;
    }

    const movedFileCount = managedFiles.filter((file) => file.folderId === folder.id).length;
    const nextFolders = managedFolders.filter((currentFolder) => currentFolder.id !== folder.id);
    const nextFiles = managedFiles.map((file) =>
      file.folderId === folder.id ? { ...file, folderId: unclassifiedFolderId } : file,
    );
    setIsSaving(true);

    try {
      await persistDocuments(nextFolders, nextFiles);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save the document data file.");
      return;
    } finally {
      setIsSaving(false);
    }

    setSelectedFileIds(new Set());
    toast.success(
      movedFileCount > 0
        ? `${folder.name} deleted. ${movedFileCount} file${
            movedFileCount === 1 ? "" : "s"
          } moved to Unclassified.`
        : `${folder.name} deleted.`,
    );
    setFolderPendingDeletion(null);

    if (activeFolder?.id === folder.id) {
      showAllFolders();
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl leading-none tracking-tight">
            {activeFolder?.name ?? "My files"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {activeFolder?.description ?? "Choose a business category to view and manage its files."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {activeFolder ? (
            <>
              <Button variant="outline" onClick={showAllFolders}>
                <ArrowLeft data-icon="inline-start" />
                All categories
              </Button>
              {activeFolder.deletable ? (
                <Button
                  variant="outline"
                  disabled={isSaving}
                  onClick={() => setFolderPendingDeletion(activeFolder)}
                >
                  <Trash2 data-icon="inline-start" />
                  Delete folder
                </Button>
              ) : null}
              <Button>
                <Upload data-icon="inline-start" />
                Upload
              </Button>
            </>
          ) : (
            <Button disabled={isSaving} onClick={() => setCreateDialogOpen(true)}>
              <FolderPlus data-icon="inline-start" />
              New folder
            </Button>
          )}
        </div>
      </div>

      {activeFolder ? (
        <>
          <FileManagerToolbar
            activeFolderId={activeFolder.id}
            folders={folderSummaries}
            selectedCount={selectedFileIds.size}
            totalCount={activeFiles.length}
            onSelectAll={selectAllFiles}
            onClearSelection={() => setSelectedFileIds(new Set())}
            onMoveSelected={moveSelectedFiles}
          />
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-medium text-lg">All files</h2>
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                spacing={0}
                value={initialView}
                aria-label="File view"
                onValueChange={(value) => {
                  if (value === "grid" || value === "list") {
                    changeView(value);
                  }
                }}
              >
                <ToggleGroupItem value="grid">
                  <Grid2X2 />
                  Grid View
                </ToggleGroupItem>
                <ToggleGroupItem value="list">
                  <List />
                  List View
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            {activeFiles.length > 0 ? (
              initialView === "list" ? (
                <FileListView
                  files={activeFiles}
                  selectedFileIds={selectedFileIds}
                  onToggleSelection={toggleSelection}
                  onToggleStar={toggleStar}
                />
              ) : (
                <FileGridView
                  files={activeFiles}
                  selectedFileIds={selectedFileIds}
                  onToggleSelection={toggleSelection}
                  onToggleStar={toggleStar}
                />
              )
            ) : (
              <Empty className="min-h-48">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <FileQuestion />
                  </EmptyMedia>
                  <EmptyTitle>No files in this folder</EmptyTitle>
                  <EmptyDescription>Upload files or move selected files here from another folder.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </div>
        </>
      ) : (
        <FoldersSection
          folders={folderSummaries}
          onOpenFolder={openFolder}
          onDeleteFolder={setFolderPendingDeletion}
        />
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <form onSubmit={createFolder} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Create folder</DialogTitle>
              <DialogDescription>Add a folder for organizing files in Documents.</DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field data-invalid={Boolean(folderNameError)}>
                <FieldLabel htmlFor="new-folder-name">Folder name</FieldLabel>
                <Input
                  id="new-folder-name"
                  value={newFolderName}
                  aria-invalid={Boolean(folderNameError)}
                  autoComplete="off"
                  onChange={(event) => {
                    setNewFolderName(event.target.value);
                    setFolderNameError("");
                  }}
                />
                {folderNameError ? <FieldError>{folderNameError}</FieldError> : null}
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isSaving}
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Create folder"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={folderPendingDeletion !== null}
        onOpenChange={(open) => {
          if (!open) {
            setFolderPendingDeletion(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {folderPendingDeletion?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              The folder will be removed. Its files will be moved to Unclassified and will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={isSaving} onClick={deleteFolder}>
              {isSaving ? "Deleting..." : "Delete folder"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
