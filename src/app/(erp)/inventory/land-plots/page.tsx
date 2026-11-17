import { InventoryService } from "@/server/services/inventory.service";
import { LandPlotsClient } from "@/components/inventory/LandPlotsClient";

export const dynamic = "force-dynamic";

export default async function LandPlotsPage() {
  const data = await InventoryService.getLandPlotsPageData();
  return <LandPlotsClient parcels={data.parcels} projects={data.projects} />;
}
