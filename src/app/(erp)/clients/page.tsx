import ClientsAndAgreementsClient from "@/components/sales/ClientsAndAgreementsClient";
import { SalesService } from "@/server/services/sales.service";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const data = await SalesService.getClientsPageData();
  return <ClientsAndAgreementsClient view="clients" clients={data.clients} />;
}
