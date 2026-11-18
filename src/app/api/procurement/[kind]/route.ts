import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { ProcurementService } from "@/server/services/procurement.service";

export const POST = withAuth<{ kind: string }>(async ({ user, request, params }) => {
  const row = await ProcurementService.createRecord(user, params.kind, await request.json());
  return NextResponse.json({ row }, { status: 201 });
});
