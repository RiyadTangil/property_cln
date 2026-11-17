import { requireUser } from "@/lib/auth";
import { OrganizationService } from "@/server/services/organization.service";
import CreateShiftForm from "@/components/organization/CreateShiftForm";

export const dynamic = "force-dynamic";

export default async function CreateShiftPage() {
  await requireUser();
  const { companyName, companyCode, branches, departments } =
    await OrganizationService.getCreateShiftPageData();

  return (
    <CreateShiftForm
      companyName={companyName}
      companyCode={companyCode}
      branches={branches}
      departments={departments}
    />
  );
}
