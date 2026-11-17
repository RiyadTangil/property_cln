import { requireUser } from "@/lib/auth";
import { OrganizationService } from "@/server/services/organization.service";
import HolidaysClient from "@/components/organization/HolidaysClient";

export const dynamic = "force-dynamic";

export default async function HolidaysPage({
  searchParams,
}: {
  searchParams: {
    search?: string;
    year?: string;
    type?: string;
    branch_id?: string;
    department_id?: string;
    status?: string;
  };
}) {
  await requireUser();
  const { holidays, branches, departments, filters } =
    await OrganizationService.getHolidaysPageData(searchParams);

  return (
    <HolidaysClient
      holidays={holidays}
      branches={branches}
      departments={departments}
      filters={filters}
    />
  );
}
