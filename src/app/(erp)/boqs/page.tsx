import { ConstructionService } from "@/server/services/construction.service";
import { BoqsClient } from "@/components/construction/BoqsClient";

export const dynamic = "force-dynamic";

export default async function BoqsPage() {
  const data = await ConstructionService.getBoqsPageData();
  return <BoqsClient boqs={data.boqs} projects={data.projects} scopes={data.scopes} />;
}
