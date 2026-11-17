import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { InventoryService } from "@/server/services/inventory.service";

export const GET = withAuth(async () => {
  const data = await InventoryService.getUnitInventoryPageData();
  return NextResponse.json(data);
});
