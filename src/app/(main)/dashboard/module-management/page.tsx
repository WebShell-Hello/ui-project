import { ModuleManagement } from "./_components/module-management";
import { readModuleConfigurationFile } from "@/lib/module-configuration-file.server";

export default async function ModuleManagementPage() {
  const initialModules = await readModuleConfigurationFile();

  return <ModuleManagement initialModules={initialModules} />;
}
