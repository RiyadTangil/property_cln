import React from "react";
import { prisma } from "@/lib/prisma";
import { PIPELINE_STAGES } from "@/lib/land";
import ParcelsClient from "@/components/land/ParcelsClient";

export const dynamic = "force-dynamic";

export default async function LandParcelsPage({
  searchParams,
}: {
  searchParams: {
    search?: string;
    stage?: string;
    land_type?: string;
    district?: string;
    project_id?: string;
    view?: string;
  };
}) {
  const search = (searchParams.search ?? "").trim();
  const stage = (searchParams.stage ?? "").trim();
  const land_type = (searchParams.land_type ?? "").trim();
  const district = (searchParams.district ?? "").trim();
  const project_id = (searchParams.project_id ?? "").trim();
  const view = (searchParams.view ?? "").trim();

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { code: { contains: search } },
      { title: { contains: search } },
      { mouza: { contains: search } },
      { district: { contains: search } },
    ];
  }
  if (stage) {
    where.stage = stage;
  } else if (view === "bank") {
    where.stage = { in: ["owned", "registered"] };
  } else if (view === "pipeline") {
    where.stage = { notIn: ["owned", "rejected", "dropped"] };
  }
  if (land_type) where.landType = land_type;
  if (district) where.district = { contains: district };
  if (project_id) where.projectId = Number(project_id);

  const [parcels, allParcelsForCounts, projects] = await Promise.all([
    prisma.landParcel.findMany({
      where,
      include: { project: { select: { id: true, name: true } } },
      orderBy: { id: "desc" },
    }),
    prisma.landParcel.groupBy({
      by: ["stage"],
      _count: { _all: true },
    }),
    prisma.project.findMany({
      orderBy: { id: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const stageCounts: Record<string, number> = {};
  for (const s of PIPELINE_STAGES) stageCounts[s.value] = 0;
  for (const row of allParcelsForCounts) {
    stageCounts[row.stage] = row._count._all;
  }

  return (
    <ParcelsClient
      parcels={parcels}
      stageCounts={stageCounts}
      projects={projects}
      filters={{ search, stage, land_type, district, project_id, view }}
    />
  );
}
