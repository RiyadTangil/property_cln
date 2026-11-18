import MoneyReceiptsClient from "@/components/sales/MoneyReceiptsClient";
import { SalesService } from "@/server/services/sales.service";

export const dynamic = "force-dynamic";

export default async function PaymentsCreatePage() {
  const data = await SalesService.getPaymentsPageData();
  return (
    <MoneyReceiptsClient
      view="payments_create"
      customers={data.customers}
      accounts={data.accounts}
      sales={data.sales}
    />
  );
}
