import { CrmService } from "@/server/services/crm.service";
import { CrmLeadDistributionList } from "@/components/crm/CrmDistributionClient";

export const dynamic = "force-dynamic";

export default async function CrmLeadDistributionPage() {
  const { distributions, branches, projects } = await CrmService.getDistributionsPageData();
  return <CrmLeadDistributionList initialItems={distributions} branches={branches} projects={projects} />;
}
