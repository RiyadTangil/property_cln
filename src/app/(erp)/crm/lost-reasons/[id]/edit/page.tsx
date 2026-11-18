import { notFound } from "next/navigation";
import { CrmService } from "@/server/services/crm.service";
import { CrmLostReasonForm } from "@/components/crm/CrmLostReasonsClient";

export const dynamic = "force-dynamic";

export default async function CrmLostReasonsEditPage({ params }: { params: { id: string } }) {
  const { lostReasons } = await CrmService.getCommonRefs();
  const item = lostReasons.find((r) => r.id === Number(params.id)) || lostReasons[0];
  if (!item) notFound();
  return <CrmLostReasonForm mode="edit" initialData={item} />;
}
