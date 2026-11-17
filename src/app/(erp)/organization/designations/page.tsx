import React from "react";
import { OrganizationService } from "@/server/services/organization.service";
import DesignationsClient from "@/components/organization/DesignationsClient";

export const dynamic = "force-dynamic";

export default async function DesignationsPage({
  searchParams,
}: {
  searchParams: { search?: string; department_id?: string; status?: string };
}) {
  const { designations, departments, companyName, filters } =
    await OrganizationService.getDesignationsPageData(searchParams);

  return (
    <DesignationsClient
      designations={designations}
      departments={departments}
      companyName={companyName}
      filters={filters}
    />
  );
}
