import { requireUser } from "@/lib/auth";
import { SettingsService } from "@/server/services/settings.service";
import MfsClient from "@/components/settings/MfsClient";

export const dynamic = "force-dynamic";

export default async function MfsServicesPage() {
  await requireUser();
  const { services } = await SettingsService.getMfsServicesPageData();

  return <MfsClient services={services} />;
}
