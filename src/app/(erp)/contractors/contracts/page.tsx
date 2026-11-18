import { ContractorsService } from "@/server/services/contractors.service";
import { ContractorWorkOrdersClient } from "@/components/contractors/ContractorWorkOrdersClient";

export const dynamic = "force-dynamic";

export default async function ContractorContractsPage() {
  const { workOrders, contractors, projects } = await ContractorsService.getWorkOrdersPageData();
  return (
    <ContractorWorkOrdersClient
      mode="contracts"
      workOrders={workOrders}
      contractors={contractors}
      projects={projects}
    />
  );
}
