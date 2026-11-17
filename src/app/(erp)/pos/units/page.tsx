import React from "react";
import { PosService } from "@/server/services/pos.service";
import UnitsClient from "@/components/pos/UnitsClient";

export const dynamic = "force-dynamic";

export default async function UnitsPage() {
  const { units, baseUnits } = await PosService.getUnitsPageData();
  return <UnitsClient units={units} baseUnits={baseUnits} />;
}
