import { ProcurementCreateFormsClient } from "@/components/procurement/ProcurementCreateFormsClient";
import { ProcurementService } from "@/server/services/procurement.service";

export const dynamic = "force-dynamic";

export default async function RequisitionCreatePage() {
  const { projects, warehouses, products } = await ProcurementService.getCommonRefs();
  return <ProcurementCreateFormsClient kind="requisitions" projects={projects} warehouses={warehouses} products={products} />;
}
