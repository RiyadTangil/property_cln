import { ProcurementCreateFormsClient } from "@/components/procurement/ProcurementCreateFormsClient";
import { ProcurementService } from "@/server/services/procurement.service";

export const dynamic = "force-dynamic";

export default async function SupplierPaymentCreatePage() {
  const { suppliers, accounts } = await ProcurementService.getSupplierPaymentsPageData();
  return <ProcurementCreateFormsClient kind="supplier-payments" suppliers={suppliers} accounts={accounts} />;
}
