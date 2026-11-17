import React from "react";
import { LandService } from "@/server/services/land.service";
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
  const { parcels, stats, projects, filters } =
    await LandService.getLandBankPageData(searchParams);

  return (
    <LandBankClient
      parcels={parcels}
      stats={stats}
      projects={projects}
      filters={filters}
    />
  );
}
