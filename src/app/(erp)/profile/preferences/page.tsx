import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfilePreferencesClient from "@/components/profile/ProfilePreferencesClient";

export const dynamic = "force-dynamic";

export default async function ProfilePreferencesPage() {
  const sessionUser = await requireUser();
  const dbUser = await prisma.user.findUnique({ where: { id: sessionUser.id } });

  return (
    <ProfilePreferencesClient
      initial={{
        theme: dbUser?.theme ?? sessionUser.theme ?? "light",
        navLayout: dbUser?.navLayout ?? sessionUser.navLayout ?? "side",
        sidebarColor: dbUser?.sidebarColor ?? sessionUser.sidebarColor ?? "light",
        timezone: dbUser?.timezone ?? "Asia/Dhaka",
        dateFormat: dbUser?.dateFormat ?? "d M Y",
        timeFormat: dbUser?.timeFormat ?? "g:i A",
      }}
    />
  );
}
