import { ProjectsService } from "@/server/services/projects.service";
import { BuildingCreateClient } from "@/components/projects/BuildingCreateClient";

export const dynamic = "force-dynamic";

export default async function BuildingCreatePage() {
  const data = await ProjectsService.getBuildingCreateData();
  return <BuildingCreateClient projects={data.projects} parcels={data.parcels} />;
}
