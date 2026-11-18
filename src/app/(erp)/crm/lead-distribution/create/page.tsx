import { CrmService } from "@/server/services/crm.service";
import { CrmLeadDistributionForm } from "@/components/crm/CrmDistributionClient";

export const dynamic = "force-dynamic";

export default async function CrmLeadDistributionCreatePage() {
  const { branches, projects } = await CrmService.getDistributionsPageData();
  return <CrmLeadDistributionForm branches={branches} projects={projects} />;
}
