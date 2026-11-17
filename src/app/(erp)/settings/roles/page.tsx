import { requireUser } from "@/lib/auth";
import { SettingsService } from "@/server/services/settings.service";
import RolesWorkbenchClient from "@/components/settings/RolesWorkbenchClient";

export const dynamic = "force-dynamic";

export default async function RolesPage() {
  await requireUser();
  const { roles, catalog } = await SettingsService.getRolesPageData();

  return <RolesWorkbenchClient roles={roles} catalog={catalog} />;
}
