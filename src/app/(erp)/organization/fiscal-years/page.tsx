import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import FiscalYearsClient from "@/components/organization/FiscalYearsClient";

export const dynamic = "force-dynamic";

export default async function FiscalYearsPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string };
}) {
  await requireUser();
  const search = (searchParams.search ?? "").trim();
  const status = (searchParams.status ?? "").trim();

  const fiscalYears = await prisma.fiscalYear.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { code: { contains: search } },
              { name: { contains: search } },
            ],
          }
        : {}),
    },
    orderBy: { startDate: "desc" },
  });

  return (
    <FiscalYearsClient
      fiscalYears={fiscalYears.map((fy) => ({
        id: fy.id,
        code: fy.code,
        name: fy.name,
        startDate: fy.startDate,
        endDate: fy.endDate,
        periodCadence: fy.periodCadence,
        hasAdjustmentPeriod: fy.hasAdjustmentPeriod,
        isCurrent: fy.isCurrent,
        status: fy.status,
        notes: fy.notes,
      }))}
      filters={{ search, status }}
    />
  );
}
