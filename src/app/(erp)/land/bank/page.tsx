import React from "react";
import { prisma } from "@/lib/prisma";
import { sqftToKatha } from "@/lib/land";
import LandBankClient from "@/components/land/LandBankClient";

export const dynamic = "force-dynamic";

export default async function LandBankPage({
  searchParams,
}: {
  searchParams: {
    search?: string;
    land_type?: string;
    district?: string;
    project_id?: string;
  };
}) {
  const search = (searchParams.search ?? "").trim();
  const land_type = (searchParams.land_type ?? "").trim();
  const district = (searchParams.district ?? "").trim();
  const project_id = (searchParams.project_id ?? "").trim();

  const where: Record<string, unknown> = {
    stage: { in: ["owned", "registered"] },
  };
  if (land_type) where.landType = land_type;
  if (district) where.district = { contains: district };
  if (project_id) where.projectId = Number(project_id);
  if (search) {
    where.OR = [
      { code: { contains: search } },
      { title: { contains: search } },
      { mouza: { contains: search } },
      { district: { contains: search } },
    ];
  }

  const [parcels, allOwned, projects] = await Promise.all([
    prisma.landParcel.findMany({
      where,
      include: { project: { select: { id: true, name: true } } },
      orderBy: { id: "desc" },
    }),
    prisma.landParcel.findMany({
      where: { stage: { in: ["owned", "registered"] } },
      select: { areaSqft: true, bookValue: true, projectId: true },
    }),
    prisma.project.findMany({
      orderBy: { id: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const totalSqft = allOwned.reduce((sum, p) => sum + p.areaSqft, 0);
  const totalBookValue = allOwned.reduce((sum, p) => sum + p.bookValue, 0);
  const unallocatedCount = allOwned.filter((p) => !p.projectId).length;

  return (
    <LandBankClient
      parcels={parcels}
      stats={{
        ownedCount: allOwned.length,
        totalKatha: sqftToKatha(totalSqft),
        totalSqft,
        totalBookValue,
        unallocatedCount,
      }}
      projects={projects}
      filters={{ search, land_type, district, project_id }}
    />
  );
}
