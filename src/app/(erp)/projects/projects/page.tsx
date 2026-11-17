import { ProjectsService } from "@/server/services/projects.service";
import { ProjectsListClient } from "@/components/projects/ProjectsListClient";

export const dynamic = "force-dynamic";

export default async function ProjectsListPage() {
  const data = await ProjectsService.getProjectsPageData({});
  return (
    <ProjectsListClient
      projects={data.projects}
      types={data.types}
      statusCounts={data.statusCounts}
      managers={data.managers}
    />
  );
}
