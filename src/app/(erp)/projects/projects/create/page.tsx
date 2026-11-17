import { ProjectsService } from "@/server/services/projects.service";
import { ProjectCreateClient } from "@/components/projects/ProjectCreateClient";

export const dynamic = "force-dynamic";

export default async function ProjectCreatePage() {
  const data = await ProjectsService.getProjectCreateData();
  return (
    <ProjectCreateClient
      types={data.types}
      categories={data.categories}
      parcels={data.parcels}
      wbsTemplates={data.wbsTemplates}
      cbsTemplates={data.cbsTemplates}
      estimateTemplates={data.estimateTemplates}
    />
  );
}
