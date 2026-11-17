import React from "react";
import { PosService } from "@/server/services/pos.service";
import ProductsClient from "@/components/pos/ProductsClient";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { search?: string; category_id?: string; type?: string; status?: string };
}) {
  const data = await PosService.getProductsPageData(searchParams);
  return <ProductsClient {...data} />;
}
