import { ContractorsService } from "@/server/services/contractors.service";
import { ContractorBillsClient } from "@/components/contractors/ContractorBillsClient";

export const dynamic = "force-dynamic";

export default async function ContractorBillsPage() {
  const { bills, contractors, projects } = await ContractorsService.getBillsPageData();
  return <ContractorBillsClient bills={bills} contractors={contractors} projects={projects} />;
}
