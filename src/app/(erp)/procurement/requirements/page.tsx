import { ProcurementOpsClient } from "@/components/procurement/ProcurementOpsClient";
import { ProcurementService } from "@/server/services/procurement.service";

export const dynamic = "force-dynamic";

export default async function MaterialRequirementsPage() {
  const { requirements, projects, warehouses, boqs } = await ProcurementService.getRequirementsPageData();
  return <ProcurementOpsClient kind="requirements" rows={requirements as unknown as Record<string, unknown>[]} projects={projects} warehouses={warehouses} boqs={boqs} />;
}
