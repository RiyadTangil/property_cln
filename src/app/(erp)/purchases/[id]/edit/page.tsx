import { PurchaseFormClient } from "@/components/procurement/PurchaseFormClient";
import { ProcurementService } from "@/server/services/procurement.service";

export const dynamic = "force-dynamic";

export default async function PurchaseEditPage({ params }: { params: { id: string } }) {
  const { purchase, suppliers, projects, warehouses, products } = await ProcurementService.getPurchaseDetailData(Number(params.id));
  return <PurchaseFormClient suppliers={suppliers} projects={projects} warehouses={warehouses} products={products} initial={purchase} />;
}
