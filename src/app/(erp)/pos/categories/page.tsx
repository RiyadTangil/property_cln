import React from "react";
import { PosService } from "@/server/services/pos.service";
import CategoriesClient from "@/components/pos/CategoriesClient";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const { categories } = await PosService.getCategoriesPageData();
  return <CategoriesClient categories={categories} />;
}
