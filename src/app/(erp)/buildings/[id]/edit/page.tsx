import { notFound } from "next/navigation";
import { ProjectsService } from "@/server/services/projects.service";
import { BuildingCreateClient } from "@/components/projects/BuildingCreateClient";

export const dynamic = "force-dynamic";

export default async function BuildingEditPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!id || Number.isNaN(id)) notFound();
  try {
    const [{ building }, createData] = await Promise.all([
      ProjectsService.getBuildingDetailData(id),
      ProjectsService.getBuildingCreateData(),
    ]);
    return (
      <BuildingCreateClient
        projects={createData.projects}
        parcels={createData.parcels}
        initialBuilding={building}
      />
    );
  } catch {
    notFound();
  }
}
