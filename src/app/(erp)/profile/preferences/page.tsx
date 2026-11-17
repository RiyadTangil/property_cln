import { requireUser } from "@/lib/auth";
import { SettingsService } from "@/server/services/settings.service";
import ProfilePreferencesClient from "@/components/profile/ProfilePreferencesClient";

export const dynamic = "force-dynamic";

export default async function ProfilePreferencesPage() {
  const sessionUser = await requireUser();
  const { initial } = await SettingsService.getProfilePreferencesPageData(sessionUser);

  return <ProfilePreferencesClient initial={initial} />;
}
