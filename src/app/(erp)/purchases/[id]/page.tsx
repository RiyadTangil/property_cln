import { PurchaseDetailClient } from "@/components/procurement/PurchaseDetailClient";
import { ProcurementService } from "@/server/services/procurement.service";

export const dynamic = "force-dynamic";

export default async function PurchaseDetailPage({ params }: { params: { id: string } }) {
  const { purchase } = await ProcurementService.getPurchaseDetailData(Number(params.id));
  return <PurchaseDetailClient purchase={purchase} />;
}
