"use client";

import * as React from "react";

import {
  applyModuleConfiguration,
  MODULE_CONFIGURATION_STORAGE_KEYS,
  MODULE_CONFIGURATION_UPDATED_EVENT,
  type ModuleRecord,
  readModuleConfiguration,
  saveModuleConfiguration,
} from "@/navigation/sidebar/module-configuration";
import { sidebarItems } from "@/navigation/sidebar/sidebar-items";

export function useConfiguredSidebarItems(initialModules?: ModuleRecord[] | null) {
  const [configuredItems, setConfiguredItems] = React.useState(() =>
    applyModuleConfiguration(sidebarItems, initialModules ?? null),
  );

  React.useEffect(() => {
    function refreshConfiguredItems() {
      setConfiguredItems(applyModuleConfiguration(sidebarItems, readModuleConfiguration()));
    }

    function handleStorageChange(event: StorageEvent) {
      if (MODULE_CONFIGURATION_STORAGE_KEYS.some((storageKey) => storageKey === event.key)) {
        refreshConfiguredItems();
      }
    }

    if (initialModules) {
      saveModuleConfiguration(initialModules);
    } else {
      refreshConfiguredItems();
    }
    window.addEventListener(MODULE_CONFIGURATION_UPDATED_EVENT, refreshConfiguredItems);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(MODULE_CONFIGURATION_UPDATED_EVENT, refreshConfiguredItems);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [initialModules]);

  return configuredItems;
}
