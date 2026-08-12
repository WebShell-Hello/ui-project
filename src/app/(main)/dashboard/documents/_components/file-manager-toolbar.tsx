import { ArrowUpDown, FolderInput, Search, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";

import type { FileManagerFolder } from "./data";

interface FileManagerToolbarProps {
  activeFolderId: string;
  folders: FileManagerFolder[];
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onMoveSelected: (folderId: string) => void;
}

export function FileManagerToolbar({
  activeFolderId,
  folders,
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onMoveSelected,
}: FileManagerToolbarProps) {
  return (
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
      <InputGroup className="md:max-w-lg">
        <InputGroupInput placeholder="Search files..." aria-label="Search files in this category" />
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
      </InputGroup>
      <div className="flex flex-1 flex-wrap items-center gap-2 xl:justify-end">
        {selectedCount > 0 ? (
          <>
            <span className="text-muted-foreground text-sm">{selectedCount} selected</span>
            <Button variant="outline" size="sm" onClick={onClearSelection}>
              Clear
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm">
                  <FolderInput data-icon="inline-start" />
                  Move selected
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Move to folder</DropdownMenuLabel>
                  {folders.map((folder) => (
                    <DropdownMenuItem
                      key={folder.id}
                      disabled={folder.id === activeFolderId}
                      onSelect={() => onMoveSelected(folder.id)}
                    >
                      {folder.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : totalCount > 0 ? (
          <Button variant="outline" size="sm" onClick={onSelectAll}>
            Select all
          </Button>
        ) : null}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <SlidersHorizontal data-icon="inline-start" />
              Filter & sort
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Show</DropdownMenuLabel>
              <DropdownMenuRadioGroup value="all">
                <DropdownMenuRadioItem value="all">All files</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="starred">Starred</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="shared">Shared</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <SlidersHorizontal />
                  File type
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent sideOffset={8}>
                  <DropdownMenuGroup>
                    <DropdownMenuRadioGroup value="all">
                      <DropdownMenuRadioItem value="all">All types</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="archive">Archive</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="image">Image</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="document">Document</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="pdf">PDF</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="spreadsheet">Spreadsheet</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <ArrowUpDown />
                  Sort by
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent sideOffset={8}>
                  <DropdownMenuGroup>
                    <DropdownMenuRadioGroup value="modified">
                      <DropdownMenuRadioItem value="modified">Last modified</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="size">File size</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
