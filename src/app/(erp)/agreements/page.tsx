import ClientsAndAgreementsClient from "@/components/sales/ClientsAndAgreementsClient";
import { SalesService } from "@/server/services/sales.service";

export const dynamic = "force-dynamic";

export default async function AgreementsPage() {
  const data = await SalesService.getAgreementsPageData();
  return (
    <ClientsAndAgreementsClient
      view="agreements"
      agreements={data.agreements}
      clients={data.clients}
      projects={data.projects}
    />
  );
}
