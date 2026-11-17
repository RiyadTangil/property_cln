import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import permissionsCatalog from "@/lib/permissions-catalog.json";
import RolesWorkbenchClient, {
  PermCatalogModule,
} from "@/components/settings/RolesWorkbenchClient";

export const dynamic = "force-dynamic";

export default async function RolesPage() {
  await requireUser();

  const roles = await prisma.role.findMany({ orderBy: { id: "asc" } });

  return (
    <RolesWorkbenchClient
      roles={roles.map((r) => {
        let perms: string[] = [];
        try {
          perms = JSON.parse(r.permissionsJson || "[]");
        } catch {
          perms = [];
        }
        return {
          id: r.id,
          name: r.name,
          scope: r.scope,
          isSuper: r.isSuper,
          permissionsCount: r.permissionsCount,
          permissions: perms,
        };
      })}
      catalog={permissionsCatalog as PermCatalogModule[]}
    />
  );
}
