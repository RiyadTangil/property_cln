import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ParcelDetailClient from "@/components/land/ParcelDetailClient";

export const dynamic = "force-dynamic";

export default async function LandParcelDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) notFound();

  const [parcel, projects] = await Promise.all([
    prisma.landParcel.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        proposals: { orderBy: { id: "desc" } },
        agreements: {
          include: { owner: { select: { id: true, name: true } } },
          orderBy: { id: "desc" },
        },
        payments: {
          include: { owner: { select: { id: true, name: true } } },
          orderBy: { id: "desc" },
        },
      },
    }),
    prisma.project.findMany({
      orderBy: { id: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!parcel) notFound();

  return <ParcelDetailClient parcel={parcel} projects={projects} />;
}
