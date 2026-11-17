import { requireUser } from "@/lib/auth";
import { OrganizationService } from "@/server/services/organization.service";
import ShiftsClient from "@/components/organization/ShiftsClient";

export const dynamic = "force-dynamic";

export default async function ShiftsPage({
  searchParams,
}: {
  searchParams: {
    search?: string;
    branch_id?: string;
    department_id?: string;
    status?: string;
  };
}) {
  await requireUser();
  const { shifts, branches, departments, filters } =
    await OrganizationService.getShiftsPageData(searchParams);

  return (
    <ShiftsClient
      shifts={shifts}
      branches={branches}
      departments={departments}
      filters={filters}
    />
  );
}
