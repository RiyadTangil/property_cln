import React from "react";
import { AccountingService } from "@/server/services/accounting.service";
import BanksClient from "@/components/accounting/BanksClient";

export const dynamic = "force-dynamic";

export default async function BanksPage() {
  const { banks } = await AccountingService.getBanksPageData();
  return <BanksClient banks={banks} />;
}
