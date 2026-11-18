import { PurchasesClient } from "@/components/procurement/PurchasesClient";
import { ProcurementService } from "@/server/services/procurement.service";

export const dynamic = "force-dynamic";

export default async function PurchasesPage() {
  const { purchases, suppliers } = await ProcurementService.getPurchasesPageData();
  return <PurchasesClient purchases={purchases} suppliers={suppliers} />;
}
