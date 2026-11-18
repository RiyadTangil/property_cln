import { CrmService } from "@/server/services/crm.service";
import { CrmLeadForm } from "@/components/crm/CrmLeadsClient";

export const dynamic = "force-dynamic";

export default async function CrmLeadsCreatePage() {
  const { projects, branches, users, units } = await CrmService.getLeadsPageData();

  return (
    <CrmLeadForm
      mode="create"
      projects={projects}
      branches={branches}
      users={users}
      units={units}
    />
  );
}
