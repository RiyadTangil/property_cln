import { ProcurementOpsClient } from "@/components/procurement/ProcurementOpsClient";
import { ProcurementService } from "@/server/services/procurement.service";

export const dynamic = "force-dynamic";

export default async function GoodsReceiptsPage() {
  const [data, poData] = await Promise.all([ProcurementService.getReceiptsPageData(), ProcurementService.getPurchasesPageData()]);
  return <ProcurementOpsClient kind="receipts" rows={data.receipts as unknown as Record<string, unknown>[]} warehouses={data.warehouses} purchases={poData.purchases} />;
}
