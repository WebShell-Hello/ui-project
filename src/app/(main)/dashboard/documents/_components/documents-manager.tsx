"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
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

import {
  type FileManagerFile,
  type FileManagerFolder,
  type FileManagerView,
  files,
  folders,
  unclassifiedFolderId,
} from "./data";
import { FileGridView } from "./file-grid-view";
import { FileListView } from "./file-list-view";
import { FileManagerToolbar } from "./file-manager-toolbar";
import { FoldersSection } from "./folders-section";

const storageKey = "studio-admin-document-manager-preferences";
const defaultFolderIds = new Set(folders.map((folder) => folder.id));
const defaultFileFolders = new Map(files.map((file) => [file.id, file.folderId]));

interface DocumentManagerPreferences {
  customFolders: FileManagerFolder[];
  deletedFolderIds: string[];
  fileFolderOverrides: Record<string, string>;
}

interface DocumentsManagerProps {
  initialFolderId?: string;
  initialView: FileManagerView;
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

export function DocumentsManager({ initialFolderId, initialView }: DocumentsManagerProps) {
  const router = useRouter();
  const [managedFolders, setManagedFolders] = useState<FileManagerFolder[]>(folders);
  const [managedFiles, setManagedFiles] = useState<FileManagerFile[]>(files);
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(() => new Set());
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [folderNameError, setFolderNameError] = useState("");
  const [folderPendingDeletion, setFolderPendingDeletion] = useState<FileManagerFolder | null>(null);

  useEffect(() => {
    const preferences = readPreferences();

    if (preferences) {
      const deletedIds = new Set(preferences.deletedFolderIds);
      const nextFolders = [
        ...folders.filter((folder) => !folder.deletable || !deletedIds.has(folder.id)),
        ...preferences.customFolders.filter((folder) => !defaultFolderIds.has(folder.id)),
      ];
      const availableFolderIds = new Set(nextFolders.map((folder) => folder.id));
      const nextFiles = files.map((file) => {
        const preferredFolderId = preferences.fileFolderOverrides[file.id] ?? file.folderId;

        return {
          ...file,
          folderId: availableFolderIds.has(preferredFolderId)
            ? preferredFolderId
            : unclassifiedFolderId,
        };
      });

      setManagedFolders(nextFolders);
      setManagedFiles(nextFiles);
    }

    setPreferencesLoaded(true);
  }, []);

  useEffect(() => {
    if (!preferencesLoaded) {
      return;
    }

    const currentFolderIds = new Set(managedFolders.map((folder) => folder.id));
    const preferences: DocumentManagerPreferences = {
      customFolders: managedFolders.filter((folder) => !defaultFolderIds.has(folder.id)),
      deletedFolderIds: folders
        .filter((folder) => folder.deletable && !currentFolderIds.has(folder.id))
        .map((folder) => folder.id),
      fileFolderOverrides: Object.fromEntries(
        managedFiles
          .filter((file) => defaultFileFolders.get(file.id) !== file.folderId)
          .map((file) => [file.id, file.folderId]),
      ),
    };

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(preferences));
    } catch {
      toast.error("Document folder changes could not be saved in this browser.");
    }
  }, [managedFiles, managedFolders, preferencesLoaded]);

  useEffect(() => {
    setSelectedFileIds(new Set());
  }, [initialFolderId]);

  const folderSummaries = useMemo(
    () =>
      managedFolders.map((folder) => ({
        ...folder,
        fileCount: managedFiles.filter((file) => file.folderId === folder.id).length,
      })),
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

  function toggleStar(fileId: string) {
    setManagedFiles((currentFiles) =>
      currentFiles.map((file) =>
        file.id === fileId ? { ...file, starred: !file.starred } : file,
      ),
    );
  }

  function moveSelectedFiles(folderId: string) {
    const targetFolder = folderSummaries.find((folder) => folder.id === folderId);

    if (!targetFolder || selectedFileIds.size === 0) {
      return;
    }

    const movedCount = selectedFileIds.size;
    setManagedFiles((currentFiles) =>
      currentFiles.map((file) =>
        selectedFileIds.has(file.id) ? { ...file, folderId } : file,
      ),
    );
    setSelectedFileIds(new Set());
    toast.success(`${movedCount} file${movedCount === 1 ? "" : "s"} moved to ${targetFolder.name}.`);
  }

  function createFolder(event: FormEvent<HTMLFormElement>) {
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

    setManagedFolders((currentFolders) => [...currentFolders, folder]);
    setNewFolderName("");
    setFolderNameError("");
    setCreateDialogOpen(false);
    toast.success(`${folder.name} created.`);
  }

  function deleteFolder() {
    const folder = folderPendingDeletion;

    if (!folder?.deletable) {
      return;
    }

    const movedFileCount = managedFiles.filter((file) => file.folderId === folder.id).length;
    setManagedFolders((currentFolders) =>
      currentFolders.filter((currentFolder) => currentFolder.id !== folder.id),
    );
    setManagedFiles((currentFiles) =>
      currentFiles.map((file) =>
        file.folderId === folder.id ? { ...file, folderId: unclassifiedFolderId } : file,
      ),
    );
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
                <Button variant="outline" onClick={() => setFolderPendingDeletion(activeFolder)}>
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
            <Button onClick={() => setCreateDialogOpen(true)}>
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
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create folder</Button>
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={deleteFolder}>
              Delete folder
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
