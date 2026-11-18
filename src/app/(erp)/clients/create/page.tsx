import ClientsAndAgreementsClient from "@/components/sales/ClientsAndAgreementsClient";
import { SalesService } from "@/server/services/sales.service";

export const dynamic = "force-dynamic";

export default async function ClientsCreatePage() {
  const data = await SalesService.getClientsPageData();
  return (
    <ClientsAndAgreementsClient view="clients_create" clients={data.clients} />
  );
}
