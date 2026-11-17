import React from "react";
import { AccountingService } from "@/server/services/accounting.service";
import LendersClient from "@/components/accounting/LendersClient";

export const dynamic = "force-dynamic";

export default async function LendersPage({
  searchParams,
}: {
  searchParams: { search?: string; type?: string };
}) {
  const { lenders, banks, filters } = await AccountingService.getLendersPageData(searchParams);
  return <LendersClient lenders={lenders} banks={banks} filters={filters} />;
}
