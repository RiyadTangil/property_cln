import { notFound } from "next/navigation";
import { CrmService } from "@/server/services/crm.service";
import { CrmLeadForm } from "@/components/crm/CrmLeadsClient";

export const dynamic = "force-dynamic";

export default async function CrmLeadEditPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!id || Number.isNaN(id)) notFound();

  try {
    const { lead, projects, branches, users, units } = await CrmService.getLeadDetailData(id);

    return (
      <CrmLeadForm
        mode="edit"
        initialLead={lead}
        projects={projects}
        branches={branches}
        users={users}
        units={units}
      />
    );
  } catch {
    notFound();
  }
}
