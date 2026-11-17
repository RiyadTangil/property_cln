import React from "react";
import { PosService } from "@/server/services/pos.service";
import BulkProductsClient from "@/components/pos/BulkProductsClient";

export const dynamic = "force-dynamic";

export default async function BulkProductsPage() {
  const { categories, units } = await PosService.getBulkProductsPageData();
  return <BulkProductsClient categories={categories} units={units} />;
}
