import MoneyReceiptsClient from "@/components/sales/MoneyReceiptsClient";
import { SalesService } from "@/server/services/sales.service";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const data = await SalesService.getPaymentsPageData();
  return (
    <MoneyReceiptsClient
      view="payments"
      payments={data.payments}
      customers={data.customers}
    />
  );
}
