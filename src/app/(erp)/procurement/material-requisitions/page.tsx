import { ProcurementOpsClient } from "@/components/procurement/ProcurementOpsClient";
import { ProcurementService } from "@/server/services/procurement.service";

export const dynamic = "force-dynamic";

export default async function MaterialRequisitionsPage() {
  const { requisitions, projects, warehouses, suppliers } = await ProcurementService.getRequisitionsPageData("material");
  return <ProcurementOpsClient kind="material-requisitions" rows={requisitions as unknown as Record<string, unknown>[]} projects={projects} warehouses={warehouses} suppliers={suppliers} />;
}
