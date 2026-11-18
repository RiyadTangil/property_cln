import { DeliveryOrdersClient } from "@/components/procurement/DeliveryOrdersClient";
import { ProcurementService } from "@/server/services/procurement.service";

export const dynamic = "force-dynamic";

export default async function DeliveryOrdersPage() {
  const { orders, suppliers } = await ProcurementService.getDeliveryOrdersPageData();
  return <DeliveryOrdersClient orders={orders} suppliers={suppliers} />;
}
