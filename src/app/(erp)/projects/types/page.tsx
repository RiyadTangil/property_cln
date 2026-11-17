import { ProjectsService } from "@/server/services/projects.service";
import { ProjectTypesClient } from "@/components/projects/ProjectTypesClient";

export const dynamic = "force-dynamic";

export default async function ProjectTypesPage() {
  const { types } = await ProjectsService.getTypesPageData();
  return <ProjectTypesClient types={types} />;
}
