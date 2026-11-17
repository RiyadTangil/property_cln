import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfileInfoClient from "@/components/profile/ProfileInfoClient";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const sessionUser = await requireUser();
  const dbUser = await prisma.user.findUnique({ where: { id: sessionUser.id } });

  return (
    <ProfileInfoClient
      user={{
        id: dbUser?.id ?? sessionUser.id,
        name: dbUser?.name ?? sessionUser.name,
        email: dbUser?.email ?? sessionUser.email,
        username: dbUser?.username ?? sessionUser.username,
        jobTitle: dbUser?.jobTitle ?? "",
        phone: dbUser?.phone ?? "",
        role: dbUser?.role ?? sessionUser.role,
        isSuperAdmin: dbUser?.isSuperAdmin ?? true,
        createdAt: dbUser
          ? dbUser.createdAt.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "30 Oct 2026",
      }}
    />
  );
}
