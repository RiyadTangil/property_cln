import { notFound } from "next/navigation";
import { ProjectsService } from "@/server/services/projects.service";
import { ProjectDetailClient } from "@/components/projects/ProjectDetailClient";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!id || Number.isNaN(id)) notFound();
  try {
    const data = await ProjectsService.getProjectDetailData(id);
    return (
      <ProjectDetailClient
        project={data.project}
        allProjects={data.allProjects}
        buildings={data.buildings}
        taskTemplates={data.taskTemplates}
      />
    );
  } catch {
    notFound();
  }
}
