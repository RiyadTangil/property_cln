import { CrmPipelineForm } from "@/components/crm/CrmPipelinesClient";

export const dynamic = "force-dynamic";

export default async function CrmSettingsPipelinesCreatePage() {
  return <CrmPipelineForm mode="create" />;
}
