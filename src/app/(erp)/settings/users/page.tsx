import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import UsersClient from "@/components/settings/UsersClient";

export const dynamic = "force-dynamic";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: { search?: string; role?: string; status?: string };
}) {
  await requireUser();
  const search = (searchParams.search ?? "").trim();
  const role = (searchParams.role ?? "").trim();
  const status = (searchParams.status ?? "").trim();

  const [users, roleRows] = await Promise.all([
    prisma.user.findMany({
      where: {
        ...(role ? { role } : {}),
        ...(status === "active"
          ? { isActive: true }
          : status === "inactive"
          ? { isActive: false }
          : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search } },
                { email: { contains: search } },
                { jobTitle: { contains: search } },
              ],
            }
          : {}),
      },
      orderBy: { id: "asc" },
    }),
    prisma.role.findMany({ orderBy: { id: "asc" } }),
  ]);

  return (
    <UsersClient
      users={users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        username: u.username,
        role: u.role,
        jobTitle: u.jobTitle,
        phone: u.phone,
        isSuperAdmin: u.isSuperAdmin,
        isActive: u.isActive,
        createdAt: u.createdAt.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
      }))}
      roles={roleRows.map((r) => r.name)}
      filters={{ search, role, status }}
    />
  );
}
