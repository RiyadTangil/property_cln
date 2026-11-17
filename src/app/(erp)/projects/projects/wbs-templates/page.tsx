import { ProjectsService } from "@/server/services/projects.service";
import { BreakdownTemplatesClient } from "@/components/projects/BreakdownTemplatesClient";

export const dynamic = "force-dynamic";

export default async function WbsTemplatesPage() {
  const data = await ProjectsService.getWbsTemplatesPageData();
  return <BreakdownTemplatesClient kind="wbs" templates={data.templates} types={data.types} categories={data.categories} />;
}
