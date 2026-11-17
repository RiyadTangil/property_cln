import { ProjectsService } from "@/server/services/projects.service";
import { InspectionChecklistsClient } from "@/components/projects/InspectionChecklistsClient";

export const dynamic = "force-dynamic";

export default async function InspectionChecklistsPage() {
  const data = await ProjectsService.getInspectionChecklistsPageData();
  return <InspectionChecklistsClient checklists={data.checklists} />;
}
