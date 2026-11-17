import { ProjectsService } from "@/server/services/projects.service";
import { EstimateTemplatesClient } from "@/components/projects/EstimateTemplatesClient";

export const dynamic = "force-dynamic";

export default async function EstimateTemplatesPage() {
  const data = await ProjectsService.getEstimateTemplatesPageData();
  return (
    <EstimateTemplatesClient
      templates={data.templates}
      cbsTemplates={data.cbsTemplates}
      wbsTemplates={data.wbsTemplates}
      types={data.types}
      categories={data.categories}
    />
  );
}
