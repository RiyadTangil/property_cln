import { ConstructionService } from "@/server/services/construction.service";
import { ResourcesClient } from "@/components/construction/ResourcesClient";

export const dynamic = "force-dynamic";

export default async function ResourcesPage() {
  const data = await ConstructionService.getResourcesPageData();
  return <ResourcesClient resources={data.resources} />;
}
