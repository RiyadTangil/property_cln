import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
  const search = (searchParams.search ?? "").trim();
  const branchId = (searchParams.branch_id ?? "").trim();
  const departmentId = (searchParams.department_id ?? "").trim();
  const status = (searchParams.status ?? "").trim();

  const [shifts, branches, departments] = await Promise.all([
    prisma.shift.findMany({
      where: {
        ...(status === "active"
          ? { isActive: true }
          : status === "inactive"
          ? { isActive: false }
          : {}),
        ...(search
          ? {
              OR: [
                { code: { contains: search } },
                { name: { contains: search } },
              ],
            }
          : {}),
      },
      orderBy: { id: "asc" },
    }),
    prisma.branch.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.department.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <ShiftsClient
      shifts={shifts.map((s) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        startTime: s.startTime,
        endTime: s.endTime,
        breakMinutes: s.breakMinutes,
        graceInMinutes: s.graceInMinutes,
        graceOutMinutes: s.graceOutMinutes,
        workingDays: s.workingDays,
        appliesTo: s.appliesTo,
        isDefault: s.isDefault,
        isActive: s.isActive,
      }))}
      branches={branches.map((b) => ({ id: b.id, name: b.name }))}
      departments={departments.map((d) => ({ id: d.id, name: d.name }))}
      filters={{ search, branch_id: branchId, department_id: departmentId, status }}
    />
  );
}
