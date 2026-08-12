import { Star } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { type FileManagerFile, fileIcons } from "./data";
import { FileActions } from "./file-actions";

interface FileListViewProps {
  files: FileManagerFile[];
  selectedFileIds: Set<string>;
  onToggleSelection: (fileId: string) => void;
  onToggleStar: (fileId: string) => void;
}

export function FileListView({
  files,
  selectedFileIds,
  onToggleSelection,
  onToggleStar,
}: FileListViewProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10 pl-0">
            <span className="sr-only">Select</span>
          </TableHead>
          <TableHead>Name</TableHead>
          <TableHead className="hidden md:table-cell">Owner</TableHead>
          <TableHead className="hidden lg:table-cell">Modified</TableHead>
          <TableHead className="hidden sm:table-cell">Size</TableHead>
          <TableHead className="w-20">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {files.map((file) => {
          const FileIcon = fileIcons[file.kind];

          return (
            <TableRow key={file.id}>
              <TableCell className="pl-0">
                <Checkbox
                  checked={selectedFileIds.has(file.id)}
                  aria-label={`Select ${file.name}`}
                  onCheckedChange={() => onToggleSelection(file.id)}
                />
              </TableCell>
              <TableCell>
                <div className="flex min-w-0 items-center gap-3">
                  <FileIcon className="size-5 shrink-0 text-muted-foreground" />
                  <Button variant="link" size="sm" className="h-auto max-w-72 justify-start px-0">
                    <span className="truncate">{file.name}</span>
                  </Button>
                  {file.shared && (
                    <Badge variant="outline" className="hidden xl:inline-flex">
                      Shared
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="flex items-center gap-2">
                  <Avatar size="sm">
                    <AvatarFallback>{file.ownerInitials}</AvatarFallback>
                  </Avatar>
                  <span>{file.owner}</span>
                </div>
              </TableCell>
              <TableCell className="hidden text-muted-foreground lg:table-cell">{file.modifiedAt}</TableCell>
              <TableCell className="hidden text-muted-foreground sm:table-cell">{file.size}</TableCell>
              <TableCell>
                <div className="flex items-center justify-end">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={file.starred ? `Unstar ${file.name}` : `Star ${file.name}`}
                    onClick={() => onToggleStar(file.id)}
                  >
                    <Star className={cn(file.starred && "fill-current")} />
                  </Button>
                  <FileActions file={file} onToggleStar={() => onToggleStar(file.id)} />
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
