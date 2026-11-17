import React from "react";
import { LandService } from "@/server/services/land.service";
import AgreementsClient from "@/components/land/AgreementsClient";

export const dynamic = "force-dynamic";

export default async function LandAgreementsPage({
  searchParams,
}: {
  searchParams: {
    from?: string;
    to?: string;
    search?: string;
    status?: string;
    type?: string;
    flag?: string;
  };
}) {
  const { agreements, parcels, owners, filters } =
    await LandService.getAgreementsPageData(searchParams);

  return (
    <AgreementsClient
      agreements={agreements}
      parcels={parcels}
      owners={owners}
      filters={filters}
    />
  );
}
