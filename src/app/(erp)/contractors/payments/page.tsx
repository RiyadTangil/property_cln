import { ContractorsService } from "@/server/services/contractors.service";
import { ContractorPaymentsClient } from "@/components/contractors/ContractorBillsClient";

export const dynamic = "force-dynamic";

export default async function ContractorPaymentsPage() {
  const data = await ContractorsService.getPaymentsPageData();
  return <ContractorPaymentsClient payments={data.payments} contractors={data.contractors} projects={data.projects} />;
}
