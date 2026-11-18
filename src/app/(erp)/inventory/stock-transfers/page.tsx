import "@/styles/modules/procurement.css";
import { ProcurementOpsClient } from "@/components/procurement/ProcurementOpsClient";
import { ProcurementService } from "@/server/services/procurement.service";

export const dynamic = "force-dynamic";

export default async function StockTransfersPage() {
  const data = await ProcurementService.getStockTransfersPageData();
  return <ProcurementOpsClient kind="stock-transfers" rows={data.transfers as unknown as Record<string, unknown>[]} warehouses={data.warehouses} />;
}
