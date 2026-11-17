import React from "react";
import { LandService } from "@/server/services/land.service";
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
  const { parcels, stageCounts, projects, filters } =
    await LandService.getParcelsPageData(searchParams);

  return (
    <ParcelsClient
      parcels={parcels}
      stageCounts={stageCounts}
      projects={projects}
      filters={filters}
    />
  );
}
