import React from "react";
import { OrganizationService } from "@/server/services/organization.service";
import CompaniesClient from "@/components/organization/CompaniesClient";

export const dynamic = "force-dynamic";

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string };
}) {
  const { companies, filters } = await OrganizationService.getCompaniesPageData(searchParams);

  return <CompaniesClient companies={companies} filters={filters} />;
}
