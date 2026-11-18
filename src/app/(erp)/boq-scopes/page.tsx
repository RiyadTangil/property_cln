import { ConstructionService } from "@/server/services/construction.service";
import { BoqScopesClient } from "@/components/construction/BoqScopesClient";

export const dynamic = "force-dynamic";

export default async function BoqScopesPage() {
  const data = await ConstructionService.getBoqScopesPageData();
  return <BoqScopesClient scopes={data.scopes} stats={data.stats} />;
}
