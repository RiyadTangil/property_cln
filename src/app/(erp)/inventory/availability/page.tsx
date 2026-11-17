import { InventoryService } from "@/server/services/inventory.service";
import { AvailabilityBoardClient } from "@/components/inventory/AvailabilityBoardClient";

export const dynamic = "force-dynamic";

export default async function AvailabilityBoardPage() {
  const data = await InventoryService.getAvailabilityPageData();
  return <AvailabilityBoardClient buildings={data.buildings} projects={data.projects} />;
}
