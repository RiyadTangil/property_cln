import { notFound } from "next/navigation";
import { CrmService } from "@/server/services/crm.service";
import { CrmPipelineForm } from "@/components/crm/CrmPipelinesClient";

export const dynamic = "force-dynamic";

export default async function CrmSettingsPipelinesEditPage({ params }: { params: { id: string } }) {
  const { pipelines } = await CrmService.getCommonRefs();
  const item = pipelines.find((r) => r.id === Number(params.id)) || pipelines[0];
  if (!item) notFound();
  return <CrmPipelineForm mode="edit" initialData={item} />;
}
