import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { ProcurementController } from "@/server/controllers/procurement.controller";
import { ProcurementService } from "@/server/services/procurement.service";

export const GET = withAuth(async () => NextResponse.json(await ProcurementService.getVendorsPageData()));
export const POST = withAuth(async ({ user, request }) => {
  const vendor = await ProcurementController.createVendor(user, await request.json());
  return NextResponse.json({ vendor }, { status: 201 });
});
