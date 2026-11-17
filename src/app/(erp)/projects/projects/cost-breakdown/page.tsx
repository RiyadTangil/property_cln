import { ProjectsService } from "@/server/services/projects.service";
import { CostBreakdownClient } from "@/components/projects/CostBreakdownClient";

export const dynamic = "force-dynamic";

export default async function CostBreakdownPage() {
  const data = await ProjectsService.getCostBreakdownPageData();
  return <CostBreakdownClient items={data.items} stats={data.stats} />;
}
