import ApartmentSalesClient from "@/components/sales/ApartmentSalesClient";
import { SalesService } from "@/server/services/sales.service";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  const data = await SalesService.getSalesPageData();
  return (
    <ApartmentSalesClient
      view="sales"
      sales={data.sales}
      projects={data.projects}
      customers={data.customers}
    />
  );
}
