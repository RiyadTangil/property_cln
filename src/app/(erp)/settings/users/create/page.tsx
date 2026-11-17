import { requireUser } from "@/lib/auth";
import { SettingsService } from "@/server/services/settings.service";
import CreateUserForm from "@/components/settings/CreateUserForm";

export const dynamic = "force-dynamic";

export default async function CreateUserPage() {
  await requireUser();
  const { companyName, roles } = await SettingsService.getCreateUserPageData();

  return <CreateUserForm companyName={companyName} roles={roles} />;
}
