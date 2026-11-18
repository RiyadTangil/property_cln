import OwnersClient from "@/components/sales/OwnersClient";
import { SalesService } from "@/server/services/sales.service";

export const dynamic = "force-dynamic";

export default async function OwnersPage() {
  const data = await SalesService.getOwnersPageData();
  return <OwnersClient view="owners" owners={data.owners} />;
}
