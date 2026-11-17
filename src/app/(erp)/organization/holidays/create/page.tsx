import { requireUser } from "@/lib/auth";
import { OrganizationService } from "@/server/services/organization.service";
import CreateHolidayForm from "@/components/organization/CreateHolidayForm";

export const dynamic = "force-dynamic";

export default async function CreateHolidayPage() {
  await requireUser();
  const { companyName, companyCode, branches, departments } =
    await OrganizationService.getCreateHolidayPageData();

  return (
    <CreateHolidayForm
      companyName={companyName}
      companyCode={companyCode}
      branches={branches}
      departments={departments}
    />
  );
}
