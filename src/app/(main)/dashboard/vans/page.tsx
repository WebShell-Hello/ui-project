import { readVanData } from "@/lib/local-business-data.server";

import { VanManagementTable } from "./_components/van-management-table";

export default async function VansPage() {
  const vans = await readVanData();

  return <VanManagementTable initialVans={vans} />;
}
