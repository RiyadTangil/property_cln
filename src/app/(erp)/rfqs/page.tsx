import { ProcurementOpsClient } from "@/components/procurement/ProcurementOpsClient";
import { ProcurementService } from "@/server/services/procurement.service";

export const dynamic = "force-dynamic";

export default async function RfqsPage() {
  const { rfqs, projects, suppliers } = await ProcurementService.getRfqsPageData();
  return <ProcurementOpsClient kind="rfqs" rows={rfqs as unknown as Record<string, unknown>[]} projects={projects} suppliers={suppliers} />;
}
