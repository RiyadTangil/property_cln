import { ProcurementOpsClient } from "@/components/procurement/ProcurementOpsClient";
import { ProcurementService } from "@/server/services/procurement.service";

export const dynamic = "force-dynamic";

export default async function PurchaseRequisitionsPage() {
  const { requisitions, projects, warehouses } = await ProcurementService.getRequisitionsPageData();
  return <ProcurementOpsClient kind="requisitions" rows={requisitions as unknown as Record<string, unknown>[]} projects={projects} warehouses={warehouses} />;
}
