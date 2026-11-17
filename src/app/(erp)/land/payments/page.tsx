import React from "react";
import { LandService } from "@/server/services/land.service";
import PaymentsClient from "@/components/land/PaymentsClient";

export const dynamic = "force-dynamic";

export default async function LandPaymentsPage({
  searchParams,
}: {
  searchParams: {
    from?: string;
    to?: string;
    search?: string;
    direction?: string;
    type?: string;
    status?: string;
  };
}) {
  const { payments, parcels, owners, filters } =
    await LandService.getPaymentsPageData(searchParams);

  return (
    <PaymentsClient
      payments={payments}
      parcels={parcels}
      owners={owners}
      filters={filters}
    />
  );
}
