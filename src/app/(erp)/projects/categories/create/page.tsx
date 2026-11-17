import { ProjectsService } from "@/server/services/projects.service";
import { ProjectCategoryCreateClient } from "@/components/projects/ProjectCategoryCreateClient";

export const dynamic = "force-dynamic";

export default async function ProjectCategoryCreatePage() {
  const { types } = await ProjectsService.getCategoriesPageData();
  return <ProjectCategoryCreateClient types={types} />;
}
