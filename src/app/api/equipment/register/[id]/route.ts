import { NextResponse } from "next/server";
import { withAuth } from "@/server/http/api-handler";
import { EquipmentController } from "@/server/controllers/equipment.controller";
import { EquipmentService } from "@/server/services/equipment.service";

export const GET = withAuth<{ id: string }>(async ({ params }) => {
  const data = await EquipmentService.getEquipmentDetailData(Number(params.id));
  return NextResponse.json(data);
});

export const PATCH = withAuth<{ id: string }>(async ({ user, request, params }) => {
  const equipment = await EquipmentController.updateEquipment(user, Number(params.id), await request.json());
  return NextResponse.json({ equipment });
});

export const DELETE = withAuth<{ id: string }>(async ({ user, params }) => {
  await EquipmentService.deleteEquipment(user, Number(params.id));
  return NextResponse.json({ ok: true });
});
