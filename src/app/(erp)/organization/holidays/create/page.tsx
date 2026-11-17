import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CreateHolidayForm from "@/components/organization/CreateHolidayForm";

export const dynamic = "force-dynamic";

export default async function CreateHolidayPage() {
  await requireUser();
  const [company, branches, departments] = await Promise.all([
    prisma.company.findFirst({ orderBy: { id: "asc" } }),
    prisma.branch.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.department.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <CreateHolidayForm
      companyName={company?.name ?? "E-Hishabi ERP"}
      companyCode={company?.code ?? "HQ"}
      branches={branches.map((b) => ({ id: b.id, name: b.name, code: b.code }))}
      departments={departments.map((d) => ({ id: d.id, name: d.name, code: d.code }))}
    />
  );
}
