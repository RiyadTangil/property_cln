import { InventoryService } from "@/server/services/inventory.service";
import { UnitInventoryClient } from "@/components/inventory/UnitInventoryClient";

export const dynamic = "force-dynamic";

export default async function UnitInventoryPage({ searchParams }: { searchParams?: { view?: string } }) {
  const data = await InventoryService.getUnitInventoryPageData();
  return (
    <UnitInventoryClient
      units={data.units}
      statusCounts={data.statusCounts}
      projects={data.projects}
      buildings={data.buildings}
      floors={data.floors}
      initialView={searchParams?.view === "list" ? "list" : "stack"}
    />
  );
}
