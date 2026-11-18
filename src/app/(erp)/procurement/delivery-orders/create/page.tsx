import { DeliveryOrderCreateClient } from "@/components/procurement/DeliveryOrderCreateClient";
import { ProcurementService } from "@/server/services/procurement.service";

export const dynamic = "force-dynamic";

export default async function DeliveryOrderCreatePage() {
  const { suppliers, projects, warehouses, products } = await ProcurementService.getCommonRefs();
  return <DeliveryOrderCreateClient suppliers={suppliers} projects={projects} warehouses={warehouses} products={products} />;
}
