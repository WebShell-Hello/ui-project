"use client";
"use no memo";

import type { ColumnDef } from "@tanstack/react-table";
import { KeyRound, MoreHorizontal, Pencil } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PublicTestUser } from "@/lib/auth/user-profile.types";
import { getInitials } from "@/lib/utils";

export function createUsersColumns({
  onEdit,
  onResetPassword,
}: {
  onEdit: (user: PublicTestUser) => void;
  onResetPassword: (user: PublicTestUser) => void;
}): ColumnDef<PublicTestUser>[] {
  return [
    {
      id: "search",
      accessorFn: (user) =>
        [user.userName, user.username, user.email, user.companyRole, user.team, user.systemRole].join(" "),
      filterFn: "includesString",
      enableHiding: true,
    },
    {
      accessorKey: "userName",
      header: "User",
      cell: ({ row }) => (
        <div className="flex min-w-52 items-center gap-3">
          <Avatar>
            <AvatarFallback>{getInitials(row.original.userName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="truncate font-medium text-sm">{row.original.userName}</div>
            <div className="truncate text-muted-foreground text-sm">{row.original.email}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "username",
      header: "Username",
      cell: ({ row }) => <code className="text-xs">{row.original.username ?? "—"}</code>,
    },
    {
      accessorKey: "companyRole",
      header: "Company role",
      filterFn: "equalsString",
    },
    {
      accessorKey: "team",
      header: "Team",
      filterFn: "equalsString",
    },
    {
      accessorKey: "systemRole",
      header: "System role",
      filterFn: "equalsString",
      cell: ({ row }) => <Badge variant="outline">{row.original.systemRole}</Badge>,
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Open actions for ${row.original.userName}`}
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => onEdit(row.original)}>
                  <Pencil />
                  Edit user
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onResetPassword(row.original)}>
                  <KeyRound />
                  Reset password
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
      enableSorting: false,
    },
  ];
}
