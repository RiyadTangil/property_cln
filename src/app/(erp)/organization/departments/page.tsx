import React from "react";
import { OrganizationService } from "@/server/services/organization.service";
import DepartmentsClient from "@/components/organization/DepartmentsClient";

export const dynamic = "force-dynamic";

export default async function DepartmentsPage({
  searchParams,
}: {
  searchParams: { search?: string; branch_id?: string; status?: string };
}) {
  const { departments, branches, companyName, filters } =
    await OrganizationService.getDepartmentsPageData(searchParams);

  return (
    <DepartmentsClient
      departments={departments}
      branches={branches}
      companyName={companyName}
      filters={filters}
    />
  );
}
