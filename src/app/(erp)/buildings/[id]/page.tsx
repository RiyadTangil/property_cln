import { notFound } from "next/navigation";
import { ProjectsService } from "@/server/services/projects.service";
import { BuildingDetailClient } from "@/components/projects/BuildingDetailClient";

export const dynamic = "force-dynamic";

export default async function BuildingDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!id || Number.isNaN(id)) notFound();
  try {
    const { building } = await ProjectsService.getBuildingDetailData(id);
    return <BuildingDetailClient building={building} />;
  } catch {
    notFound();
  }
}
