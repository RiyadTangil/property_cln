import { InventoryService } from "@/server/services/inventory.service";
import { PriceListsClient } from "@/components/inventory/PriceListsClient";

export const dynamic = "force-dynamic";

export default async function PriceListsPage() {
  const data = await InventoryService.getPriceListsPageData();
  return <PriceListsClient units={data.units} buildings={data.buildings} />;
}
