import { ProjectsService } from "@/server/services/projects.service";
import { ProjectParametersClient } from "@/components/projects/ProjectParametersClient";

export const dynamic = "force-dynamic";

export default async function ProjectParametersPage() {
  const data = await ProjectsService.getParametersPageData();
  return <ProjectParametersClient parameters={data.parameters} types={data.types} categories={data.categories} />;
}
