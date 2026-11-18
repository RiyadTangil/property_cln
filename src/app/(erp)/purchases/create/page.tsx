import { PurchaseFormClient } from "@/components/procurement/PurchaseFormClient";
import { ProcurementService } from "@/server/services/procurement.service";

export const dynamic = "force-dynamic";

export default async function PurchaseCreatePage() {
  const { suppliers, projects, warehouses, products } = await ProcurementService.getCommonRefs();
  return <PurchaseFormClient suppliers={suppliers} projects={projects} warehouses={warehouses} products={products} />;
}
