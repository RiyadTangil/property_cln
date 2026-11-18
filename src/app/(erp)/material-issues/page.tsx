import { ProcurementOpsClient } from "@/components/procurement/ProcurementOpsClient";
import { ProcurementService } from "@/server/services/procurement.service";

export const dynamic = "force-dynamic";

export default async function MaterialIssuesPage() {
  const data = await ProcurementService.getMaterialIssuesPageData();
  return <ProcurementOpsClient kind="material-issues" rows={data.issues as unknown as Record<string, unknown>[]} projects={data.projects} warehouses={data.warehouses} />;
}
