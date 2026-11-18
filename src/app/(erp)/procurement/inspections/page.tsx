import { ProcurementOpsClient } from "@/components/procurement/ProcurementOpsClient";
import { ProcurementService } from "@/server/services/procurement.service";

export const dynamic = "force-dynamic";

export default async function ProcurementInspectionsPage() {
  const [data, recData] = await Promise.all([ProcurementService.getInspectionsPageData(), ProcurementService.getReceiptsPageData()]);
  return <ProcurementOpsClient kind="inspections" rows={data.inspections as unknown as Record<string, unknown>[]} receipts={recData.receipts} />;
}
