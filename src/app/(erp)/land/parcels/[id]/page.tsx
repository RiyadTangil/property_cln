import React from "react";
import { notFound } from "next/navigation";
import { LandService } from "@/server/services/land.service";
import ParcelDetailClient from "@/components/land/ParcelDetailClient";

export const dynamic = "force-dynamic";

export default async function LandParcelDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const id = Number(params.id);
  if (!Number.isInteger(id)) notFound();

  const data = await LandService.getParcelDetailPageData(id);
  if (!data) notFound();

  return <ParcelDetailClient parcel={data.parcel} projects={data.projects} />;
}
