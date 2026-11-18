import { SuppliersClient } from "@/components/procurement/SuppliersClient";
import { ProcurementService } from "@/server/services/procurement.service";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const { suppliers } = await ProcurementService.getSuppliersPageData();
  return <SuppliersClient suppliers={suppliers} />;
}
