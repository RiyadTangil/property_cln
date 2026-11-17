import { requireUser } from "@/lib/auth";
import ProfileSecurityClient from "@/components/profile/ProfileSecurityClient";

export const dynamic = "force-dynamic";

export default async function ProfileSecurityPage() {
  const user = await requireUser();
  return <ProfileSecurityClient email={user.email} />;
}
