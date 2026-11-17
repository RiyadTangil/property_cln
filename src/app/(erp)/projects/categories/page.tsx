import { ProjectsService } from "@/server/services/projects.service";
import { ProjectCategoriesClient } from "@/components/projects/ProjectCategoriesClient";

export const dynamic = "force-dynamic";

export default async function ProjectCategoriesPage() {
  const { categories, types } = await ProjectsService.getCategoriesPageData();
  return <ProjectCategoriesClient categories={categories} types={types} />;
}
