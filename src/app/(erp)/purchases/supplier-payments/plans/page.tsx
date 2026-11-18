import { ProcurementOpsClient } from "@/components/procurement/ProcurementOpsClient";
import { ProcurementService } from "@/server/services/procurement.service";

export const dynamic = "force-dynamic";

export default async function SupplierPaymentPlansPage() {
  const data = await ProcurementService.getSupplierPaymentsPageData();
  return <ProcurementOpsClient kind="supplier-payments" rows={data.payments as unknown as Record<string, unknown>[]} suppliers={data.suppliers} />;
}
