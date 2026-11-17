import React from "react";
import { LandService } from "@/server/services/land.service";
import OwnersClient from "@/components/land/OwnersClient";

export const dynamic = "force-dynamic";

export default async function LandOwnersPage({
  searchParams,
}: {
  searchParams: {
    search?: string;
    kind?: string;
    district?: string;
    status?: string;
    flag?: string;
  };
}) {
  const { owners, filters } = await LandService.getOwnersPageData(searchParams);

  return <OwnersClient owners={owners} filters={filters} />;
}
