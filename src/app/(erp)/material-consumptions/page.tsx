import { ProcurementOpsClient } from "@/components/procurement/ProcurementOpsClient";
import { ProcurementService } from "@/server/services/procurement.service";

export const dynamic = "force-dynamic";

export default async function MaterialConsumptionsPage() {
  const data = await ProcurementService.getMaterialConsumptionsPageData();
  return <ProcurementOpsClient kind="material-consumptions" rows={data.consumptions as unknown as Record<string, unknown>[]} projects={data.projects} warehouses={data.warehouses} />;
}
