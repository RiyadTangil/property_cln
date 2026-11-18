import { CrmService } from "@/server/services/crm.service";
import { CrmPipelinesList } from "@/components/crm/CrmPipelinesClient";

export const dynamic = "force-dynamic";

export default async function CrmSettingsPipelinesPage() {
  const { pipelines } = await CrmService.getCommonRefs();
  return <CrmPipelinesList initialItems={pipelines} />;
}
