import { ProjectsService } from "@/server/services/projects.service";
import { BreakdownTemplatesClient } from "@/components/projects/BreakdownTemplatesClient";

export const dynamic = "force-dynamic";

export default async function ItpTemplatesPage() {
  const data = await ProjectsService.getItpTemplatesPageData();
  return <BreakdownTemplatesClient kind="itp" templates={data.templates} types={data.types} categories={data.categories} />;
}
