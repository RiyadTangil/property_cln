import { CrmService } from "@/server/services/crm.service";
import { CrmFollowupTypesList } from "@/components/crm/CrmFollowupTypesClient";

export const dynamic = "force-dynamic";

export default async function CrmFollowupTypesPage() {
  const { followupTypes } = await CrmService.getCommonRefs();
  return <CrmFollowupTypesList initialItems={followupTypes} />;
}
