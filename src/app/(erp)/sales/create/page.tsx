import ApartmentSalesClient from "@/components/sales/ApartmentSalesClient";
import { SalesService } from "@/server/services/sales.service";

export const dynamic = "force-dynamic";

export default async function SalesCreatePage() {
  const data = await SalesService.getSalesPageData();
  return (
    <ApartmentSalesClient
      view="sales_create"
      projects={data.projects}
      customers={data.customers}
      employees={data.employees}
      units={data.units}
    />
  );
}
