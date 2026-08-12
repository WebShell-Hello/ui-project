import { readDriverData } from "@/lib/local-business-data.server";

import { DriverProfilesTable } from "./_components/driver-profiles-table";

export default async function DriverProfilesPage() {
  const drivers = await readDriverData();

  return <DriverProfilesTable initialDrivers={drivers} />;
}
