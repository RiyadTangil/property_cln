import React from "react";
import { LandService } from "@/server/services/land.service";
import ProposalsClient from "@/components/land/ProposalsClient";

export const dynamic = "force-dynamic";

export default async function LandProposalsPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string; search?: string; status?: string };
}) {
  const { proposals, parcels, filters } =
    await LandService.getProposalsPageData(searchParams);

  return (
    <ProposalsClient
      proposals={proposals}
      parcels={parcels}
      filters={filters}
    />
  );
}
