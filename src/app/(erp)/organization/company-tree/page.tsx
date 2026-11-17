import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CompanyTreeClient from "@/components/organization/CompanyTreeClient";

export const dynamic = "force-dynamic";

export default async function CompanyTreePage() {
  await requireUser();

  const [company, branches, departments] = await Promise.all([
    prisma.company.findFirst({ orderBy: { id: "asc" } }),
    prisma.branch.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.department.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: { _count: { select: { designations: true } } },
    }),
  ]);

  return (
    <CompanyTreeClient
      company={{
        id: company?.id ?? 1,
        code: company?.code ?? "HQ",
        name: company?.name ?? "E-Hishabi ERP",
        currency: company?.currency ?? "BDT",
      }}
      branches={branches.map((b) => ({
        id: b.id,
        code: b.code,
        name: b.name,
        type: b.type,
        city: b.city,
      }))}
      departments={departments.map((d) => ({
        id: d.id,
        code: d.code,
        name: d.name,
        branchId: d.branchId,
        parentId: d.parentId,
        headName: d.headName,
        designationsCount: d._count.designations,
      }))}
    />
  );
}
