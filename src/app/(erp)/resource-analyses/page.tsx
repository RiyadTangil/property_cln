import { RateAnalysisClient } from "@/components/construction/RateAnalysisClient";
import { ConstructionService } from "@/server/services/construction.service";

export const dynamic = "force-dynamic";

export default async function ResourceAnalysesPage() {
  const data = await ConstructionService.getRateAnalysisPageData();
  return <RateAnalysisClient {...data} />;
}
