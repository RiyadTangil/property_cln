import ApartmentSalesClient from "@/components/sales/ApartmentSalesClient";
import { SalesService } from "@/server/services/sales.service";

export const dynamic = "force-dynamic";

export default async function SalesTargetsPage() {
  const data = await SalesService.getTargetsPageData();
  return (
    <ApartmentSalesClient
      view="sales_targets"
      targets={data.targets}
      employees={data.employees}
      departments={data.departments}
    />
  );
}
