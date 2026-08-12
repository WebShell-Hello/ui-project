"use client";

import Link from "next/link";

import { Command } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
// import { rootUser } from "@/data/users";
// import { sidebarItems } from "@/navigation/sidebar/sidebar-items";
import {
  roleHomeRoutes,
  type AppRole,
} from "@/lib/access-control/role-access.data";
import { filterSidebarItems } from "@/navigation/sidebar/filter-sidebar-items";
import type { ModuleRecord } from "@/navigation/sidebar/module-configuration";
import { useConfiguredSidebarItems } from "@/navigation/sidebar/use-configured-sidebar-items";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

import { NavMain } from "./nav-main";
// import { NavUser } from "./nav-user";
import { NavUser, type NavUserData } from "./nav-user";
import { SupportCard } from "./support-card";

const roleLabels: Record<AppRole, string> = {
  admin: "Admin",
  director: "Director",
  manager: "Manager",
  guest: "Guest",
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  readonly role: AppRole;
  readonly user: NavUserData;
  readonly initialModules?: ModuleRecord[] | null;
}
export function AppSidebar({
  role,
  user,
  initialModules,
  ...props
}: AppSidebarProps) {
  const { sidebarVariant, sidebarCollapsible, isSynced } = usePreferencesStore(
    useShallow((s) => ({
      sidebarVariant: s.values.sidebar_variant,
      sidebarCollapsible: s.values.sidebar_collapsible,
      isSynced: s.isSynced,
    })),
  );

  const variant = isSynced ? sidebarVariant : props.variant;
  const collapsible = isSynced ? sidebarCollapsible : props.collapsible;
  const configuredSidebarItems = useConfiguredSidebarItems(initialModules);
  const permittedSidebarItems = filterSidebarItems(configuredSidebarItems, role);
  const homeUrl = roleHomeRoutes[role];

  return (
    <Sidebar {...props} variant={variant} collapsible={collapsible}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              {/* <Link prefetch={false} href="/dashboard/default"> */}
              <Link prefetch={false} href={homeUrl}>
                <Command />
                <span className="font-semibold text-base">{roleLabels[role]}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={permittedSidebarItems} />
      </SidebarContent>
      <SidebarFooter>
        <SupportCard />
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
