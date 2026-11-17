import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CreateUserForm from "@/components/settings/CreateUserForm";

export const dynamic = "force-dynamic";

export default async function CreateUserPage() {
  await requireUser();
  const [company, roles] = await Promise.all([
    prisma.company.findFirst({ orderBy: { id: "asc" } }),
    prisma.role.findMany({ orderBy: { id: "asc" } }),
  ]);

  return (
    <CreateUserForm
      companyName={company?.name ?? "E-Hishabi ERP"}
      roles={roles.map((r) => ({ id: r.id, name: r.name, scope: r.scope }))}
    />
  );
}
