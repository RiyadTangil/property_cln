import { CrmLostReasonForm } from "@/components/crm/CrmLostReasonsClient";

export const dynamic = "force-dynamic";

export default async function CrmLostReasonsCreatePage() {
  return <CrmLostReasonForm mode="create" />;
}
