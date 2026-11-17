import { InventoryService } from "@/server/services/inventory.service";
import { UnitBlockingClient } from "@/components/inventory/UnitBlockingClient";

export const dynamic = "force-dynamic";

export default async function UnitBlockingPage() {
  const data = await InventoryService.getUnitInventoryPageData();
  return <UnitBlockingClient units={data.units} />;
}
