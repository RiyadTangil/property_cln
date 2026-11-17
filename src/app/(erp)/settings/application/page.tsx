import { requireUser } from "@/lib/auth";
import { SettingsService } from "@/server/services/settings.service";
import AppSettingsClient from "@/components/settings/AppSettingsClient";

export const dynamic = "force-dynamic";

export default async function ApplicationSettingsPage() {
  await requireUser();
  const { initial } = await SettingsService.getApplicationSettingsPageData();

  return <AppSettingsClient initial={initial} />;
}
