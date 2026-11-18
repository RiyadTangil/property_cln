import ClientsAndAgreementsClient from "@/components/sales/ClientsAndAgreementsClient";
import { SalesService } from "@/server/services/sales.service";

export const dynamic = "force-dynamic";

export default async function AgreementsCreatePage() {
  const data = await SalesService.getAgreementsPageData();
  return (
    <ClientsAndAgreementsClient
      view="agreements_create"
      clients={data.clients}
      projects={data.projects}
    />
  );
}
