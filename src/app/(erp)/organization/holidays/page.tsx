import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
  const search = (searchParams.search ?? "").trim();
  const year = (searchParams.year ?? "").trim();
  const type = (searchParams.type ?? "").trim();
  const branchId = (searchParams.branch_id ?? "").trim();
  const departmentId = (searchParams.department_id ?? "").trim();
  const status = (searchParams.status ?? "").trim();

  const [holidays, branches, departments] = await Promise.all([
    prisma.holiday.findMany({
      where: {
        ...(type ? { type } : {}),
        ...(year ? { startDate: { startsWith: year } } : {}),
        ...(status === "active"
          ? { isActive: true }
          : status === "inactive"
          ? { isActive: false }
          : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search } },
                { description: { contains: search } },
              ],
            }
          : {}),
      },
      orderBy: { startDate: "asc" },
    }),
    prisma.branch.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.department.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <HolidaysClient
      holidays={holidays.map((h) => ({
        id: h.id,
        name: h.name,
        type: h.type,
        startDate: h.startDate,
        endDate: h.endDate,
        color: h.color,
        description: h.description,
        appliesTo: h.appliesTo,
        isRecurring: h.isRecurring,
        isPaid: h.isPaid,
        isActive: h.isActive,
      }))}
      branches={branches.map((b) => ({ id: b.id, name: b.name }))}
      departments={departments.map((d) => ({ id: d.id, name: d.name }))}
      filters={{
        search,
        year,
        type,
        branch_id: branchId,
        department_id: departmentId,
        status,
      }}
    />
  );
}
