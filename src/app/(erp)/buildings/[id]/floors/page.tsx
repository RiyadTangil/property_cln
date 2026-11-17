import { notFound } from "next/navigation";
import { ProjectsService } from "@/server/services/projects.service";
import { BuildingFloorsClient } from "@/components/projects/BuildingFloorsClient";

export const dynamic = "force-dynamic";

export default async function BuildingFloorsPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!id || Number.isNaN(id)) notFound();
  try {
    const { building } = await ProjectsService.getBuildingDetailData(id);
    return <BuildingFloorsClient building={building} />;
  } catch {
    notFound();
  }
}
