import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CreateFiscalYearForm from "@/components/organization/CreateFiscalYearForm";

export const dynamic = "force-dynamic";

export default async function CreateFiscalYearPage() {
  await requireUser();
  const company = await prisma.company.findFirst({ orderBy: { id: "asc" } });
  return (
    <CreateFiscalYearForm
      companyName={company?.name ?? "E-Hishabi ERP"}
      companyCode={company?.code ?? "HQ"}
    />
  );
}
