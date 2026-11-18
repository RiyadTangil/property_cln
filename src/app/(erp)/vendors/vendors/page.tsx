import { VendorsClient } from "@/components/procurement/VendorsClient";
import { ProcurementService } from "@/server/services/procurement.service";

export const dynamic = "force-dynamic";

export default async function VendorsPage() {
  const { vendors } = await ProcurementService.getVendorsPageData();
  return <VendorsClient vendors={vendors} />;
}
