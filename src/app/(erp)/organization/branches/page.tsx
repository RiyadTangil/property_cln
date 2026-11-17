import React from "react";
import { OrganizationService } from "@/server/services/organization.service";
import BranchesClient from "@/components/organization/BranchesClient";

export const dynamic = "force-dynamic";

export default async function BranchesPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string };
}) {
  const { branches, companyName, filters } =
    await OrganizationService.getBranchesPageData(searchParams);

  return (
    <BranchesClient
      branches={branches}
      companyName={companyName}
      filters={filters}
    />
  );
}
