import React from "react";
import { AccountingService } from "@/server/services/accounting.service";
import AccountsClient from "@/components/accounting/AccountsClient";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const { accounts, summary, groupParents } = await AccountingService.getAccountsPageData();
  return (
    <AccountsClient
      accounts={accounts}
      summary={summary}
      groupParents={groupParents}
    />
  );
}
