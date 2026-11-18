import { ConstructionService } from "@/server/services/construction.service";
import { RateAnalysisClient } from "@/components/construction/RateAnalysisClient";

export const dynamic = "force-dynamic";

export default async function RateAnalysisWorkbenchPage() {
  const data = await ConstructionService.getRateAnalysisPageData();
  return <RateAnalysisClient analyses={data.analyses} resources={data.resources} cbsItems={data.cbsItems} />;
}
