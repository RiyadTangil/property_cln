import { notFound } from "next/navigation";
import { ProjectsService } from "@/server/services/projects.service";
import { ProjectCreateClient } from "@/components/projects/ProjectCreateClient";

export const dynamic = "force-dynamic";

export default async function ProjectEditPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!id || Number.isNaN(id)) notFound();
  try {
    const [{ project }, createData] = await Promise.all([
      ProjectsService.getProjectDetailData(id),
      ProjectsService.getProjectCreateData(),
    ]);
    return (
      <ProjectCreateClient
        types={createData.types}
        categories={createData.categories}
        parcels={createData.parcels}
        wbsTemplates={createData.wbsTemplates}
        cbsTemplates={createData.cbsTemplates}
        estimateTemplates={createData.estimateTemplates}
        initialProject={project}
      />
    );
  } catch {
    notFound();
  }
}
