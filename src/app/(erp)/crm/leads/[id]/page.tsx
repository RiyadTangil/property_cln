import { notFound } from "next/navigation";
import { CrmService } from "@/server/services/crm.service";
import { CrmLeadDetail } from "@/components/crm/CrmLeadsClient";

export const dynamic = "force-dynamic";

export default async function CrmLeadDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!id || Number.isNaN(id)) notFound();

  try {
    const { lead, followups, projects, branches, users, lostReasons } =
      await CrmService.getLeadDetailData(id);

    return (
      <CrmLeadDetail
        initialLead={lead}
        initialFollowups={followups}
        projects={projects}
        branches={branches}
        users={users}
        lostReasons={lostReasons}
      />
    );
  } catch {
    notFound();
  }
}
