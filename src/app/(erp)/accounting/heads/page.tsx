import React from "react";
import { AccountingService } from "@/server/services/accounting.service";
import HeadsClient from "@/components/accounting/HeadsClient";

export const dynamic = "force-dynamic";

export default async function HeadsPage() {
  const { heads, accounts } = await AccountingService.getHeadsPageData();
  return <HeadsClient heads={heads} accounts={accounts} />;
}
