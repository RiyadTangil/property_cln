import { CrmService } from "@/server/services/crm.service";
import { CrmLostReasonsList } from "@/components/crm/CrmLostReasonsClient";

export const dynamic = "force-dynamic";

export default async function CrmLostReasonsPage() {
  const { lostReasons } = await CrmService.getCommonRefs();
  return <CrmLostReasonsList initialItems={lostReasons} />;
}
