import { ContractorsService } from "@/server/services/contractors.service";
import { WorkOrderCreateClient } from "@/components/contractors/WorkOrderCreateClient";

export const dynamic = "force-dynamic";

export default async function ContractorWorkOrderCreatePage() {
  const data = await ContractorsService.getWorkOrdersPageData();
  return <WorkOrderCreateClient contractors={data.contractors} projects={data.projects} />;
}
