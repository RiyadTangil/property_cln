import { CrmService } from "@/server/services/crm.service";
import { CrmFollowupForm } from "@/components/crm/CrmFollowupsClient";

export const dynamic = "force-dynamic";

export default async function CrmFollowupsCreatePage({
  searchParams,
}: {
  searchParams?: { customer_id?: string; lead_id?: string };
}) {
  const { leads, customers, followupTypes, users, branches } =
    await CrmService.getFollowupsPageData();
  return (
    <CrmFollowupForm
      mode="create"
      leads={leads}
      customers={customers}
      followupTypes={followupTypes}
      users={users}
      branches={branches}
      defaultCustomerId={searchParams?.customer_id}
      defaultLeadId={searchParams?.lead_id}
    />
  );
}
