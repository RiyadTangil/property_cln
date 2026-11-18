import { notFound } from "next/navigation";
import { CrmService } from "@/server/services/crm.service";
import { CrmFollowupDetail } from "@/components/crm/CrmFollowupsClient";

export const dynamic = "force-dynamic";

export default async function CrmFollowupDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isFinite(id) || id <= 0) notFound();
  try {
    const { followup, leads, customers, followupTypes, users, branches } =
      await CrmService.getFollowupDetailData(id);
    return (
      <CrmFollowupDetail
        followup={followup}
        leads={leads}
        customers={customers}
        followupTypes={followupTypes}
        users={users}
        branches={branches}
      />
    );
  } catch {
    notFound();
  }
}
