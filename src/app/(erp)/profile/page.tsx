import { requireUser } from "@/lib/auth";
import { SettingsService } from "@/server/services/settings.service";
import ProfileInfoClient from "@/components/profile/ProfileInfoClient";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const sessionUser = await requireUser();
  const { user } = await SettingsService.getProfilePageData(sessionUser);

  return <ProfileInfoClient user={user} />;
}
