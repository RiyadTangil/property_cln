import { requireUser } from "@/lib/auth";
import { OrganizationService } from "@/server/services/organization.service";
import CompanyTreeClient from "@/components/organization/CompanyTreeClient";

export const dynamic = "force-dynamic";

export default async function CompanyTreePage() {
  await requireUser();
  const { company, branches, departments } =
    await OrganizationService.getCompanyTreePageData();

  return (
    <CompanyTreeClient
      company={company}
      branches={branches}
      departments={departments}
    />
  );
}
