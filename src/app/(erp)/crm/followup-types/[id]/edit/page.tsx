import { notFound } from "next/navigation";
import { CrmService } from "@/server/services/crm.service";
import { CrmFollowupTypeForm } from "@/components/crm/CrmFollowupTypesClient";

export const dynamic = "force-dynamic";

export default async function CrmFollowupTypesEditPage({ params }: { params: { id: string } }) {
  const { followupTypes } = await CrmService.getCommonRefs();
  const item = followupTypes.find((r) => r.id === Number(params.id)) || followupTypes[0];
  if (!item) notFound();
  return <CrmFollowupTypeForm mode="edit" initialData={item} />;
}
