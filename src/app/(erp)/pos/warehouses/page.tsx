import React from "react";
import { PosService } from "@/server/services/pos.service";
import WarehousesClient from "@/components/pos/WarehousesClient";

export const dynamic = "force-dynamic";

export default async function WarehousesPage() {
  const { warehouses, branches, projects } = await PosService.getWarehousesPageData();
  return (
    <WarehousesClient
      warehouses={warehouses}
      branches={branches}
      projects={projects}
    />
  );
}
