import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { EquipmentService } from "@/server/services/equipment.service";

export const GET = withAuth<{ kind: string }>(async ({ params }) => {
  const data = await EquipmentService.getSubModulePageData(
    params.kind as "assignments" | "usage" | "fuel" | "work-orders" | "inspections" | "operators" | "rentals"
  );
  return NextResponse.json(data);
});

export const POST = withAuth<{ kind: string }>(async ({ user, request, params }) => {
  const row = await EquipmentService.createSubModuleRecord(user, params.kind, await request.json());
  return NextResponse.json({ row }, { status: 201 });
});
