import { ProjectsService } from "@/server/services/projects.service";
import { BuildingsListClient } from "@/components/projects/BuildingsListClient";

export const dynamic = "force-dynamic";

export default async function BuildingsPage() {
  const data = await ProjectsService.getBuildingsPageData();
  return <BuildingsListClient buildings={data.buildings} statusCounts={data.statusCounts} />;
}
