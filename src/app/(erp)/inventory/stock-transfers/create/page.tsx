import "@/styles/modules/procurement.css";
import { ProcurementCreateFormsClient } from "@/components/procurement/ProcurementCreateFormsClient";
import { ProcurementService } from "@/server/services/procurement.service";

export const dynamic = "force-dynamic";

export default async function StockTransferCreatePage() {
  const { warehouses, products } = await ProcurementService.getCommonRefs();
  return <ProcurementCreateFormsClient kind="stock-transfers" warehouses={warehouses} products={products} />;
}
