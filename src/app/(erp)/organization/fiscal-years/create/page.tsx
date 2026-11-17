import { requireUser } from "@/lib/auth";
import { OrganizationService } from "@/server/services/organization.service";
import CreateFiscalYearForm from "@/components/organization/CreateFiscalYearForm";

export const dynamic = "force-dynamic";

export default async function CreateFiscalYearPage() {
  await requireUser();
  const { companyName, companyCode } =
    await OrganizationService.getCreateFiscalYearPageData();

  return (
    <CreateFiscalYearForm companyName={companyName} companyCode={companyCode} />
  );
}
