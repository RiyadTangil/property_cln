import { CrmService } from "@/server/services/crm.service";
import { CrmFollowupsList } from "@/components/crm/CrmFollowupsClient";

export const dynamic = "force-dynamic";

export default async function CrmFollowupsPage() {
  const { followups, leads, customers, followupTypes, users, branches } =
    await CrmService.getFollowupsPageData();
  return (
    <CrmFollowupsList
      initialItems={followups}
      leads={leads}
      customers={customers}
      followupTypes={followupTypes}
      users={users}
      branches={branches}
    />
  );
}
