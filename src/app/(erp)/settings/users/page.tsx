import { requireUser } from "@/lib/auth";
import { SettingsService } from "@/server/services/settings.service";
import UsersClient from "@/components/settings/UsersClient";

export const dynamic = "force-dynamic";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: { search?: string; role?: string; status?: string };
}) {
  await requireUser();
  const { users, roles, filters } = await SettingsService.getUsersPageData(searchParams);

  return <UsersClient users={users} roles={roles} filters={filters} />;
}
