import { ProjectsService } from "@/server/services/projects.service";
import { BreakdownTemplatesClient } from "@/components/projects/BreakdownTemplatesClient";

export const dynamic = "force-dynamic";

export default async function CbsTemplatesPage() {
  const data = await ProjectsService.getCbsTemplatesPageData();
  return <BreakdownTemplatesClient kind="cbs" templates={data.templates} types={data.types} categories={data.categories} />;
}
