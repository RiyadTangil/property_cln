import { requireUser } from "@/lib/auth";
import { OrganizationService } from "@/server/services/organization.service";
import FiscalYearsClient from "@/components/organization/FiscalYearsClient";

export const dynamic = "force-dynamic";

export default async function FiscalYearsPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string };
}) {
  await requireUser();
  const { fiscalYears, filters } =
    await OrganizationService.getFiscalYearsPageData(searchParams);

  return <FiscalYearsClient fiscalYears={fiscalYears} filters={filters} />;
}
