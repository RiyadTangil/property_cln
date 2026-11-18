import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { ProcurementService } from "@/server/services/procurement.service";

export const DELETE = withAuth<{ id: string }>(async ({ user, params }) => {
  await ProcurementService.deleteSupplier(user, Number(params.id));
  return NextResponse.json({ ok: true });
});
